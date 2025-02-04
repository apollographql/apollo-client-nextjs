/* eslint-disable prefer-rest-params */
import type {
  ApolloClientOptions,
  OperationVariables,
  WatchQueryOptions,
  FetchResult,
  DocumentNode,
  NormalizedCacheObject,
} from "@apollo/client/index.js";

import {
  ApolloLink,
  ApolloClient as OrigApolloClient,
  Observable,
} from "@apollo/client/index.js";
import type { QueryManager } from "@apollo/client/core/QueryManager.js";
import { print } from "@apollo/client/utilities/index.js";
import { canonicalStringify } from "@apollo/client/cache/index.js";
import { invariant } from "ts-invariant";
import { createBackpressuredCallback } from "./backpressuredCallback.js";
import type { InMemoryCache } from "./WrappedInMemoryCache.js";
import { hookWrappers } from "./hooks.js";
import type { HookWrappers } from "@apollo/client/react/internal/index.js";
import type { QueryInfo } from "@apollo/client/core/QueryInfo.js";
import type {
  ProgressEvent,
  QueryEvent,
  TransportIdentifier,
} from "./DataTransportAbstraction.js";
import { bundle, sourceSymbol } from "../bundleInfo.js";
import { serializeOptions, deserializeOptions } from "./transportedOptions.js";
import { assertInstance } from "../assertInstance.js";
import {
  ReadFromReadableStreamLink,
  TeeToReadableStreamLink,
} from "../ReadableStreamLink.js";

function getQueryManager(
  client: OrigApolloClient<unknown>
): QueryManager<NormalizedCacheObject> & {
  [wrappers]: HookWrappers;
} {
  return client["queryManager"];
}

declare class Trie<Data> {
  constructor(weakness?: boolean, makeData?: (array: any[]) => Data);
  lookup<T extends any[]>(...array: T): Data;
  lookupArray<T extends IArguments | any[]>(array: T): Data;
  peek<T extends any[]>(...array: T): Data | undefined;
  peekArray<T extends IArguments | any[]>(array: T): Data | undefined;
  remove(...array: any[]): Data | undefined;
  removeArray<T extends IArguments | any[]>(array: T): Data | undefined;
}

/**
 * Returns the `Trie` constructor without adding a direct dependency on `@wry/trie`.
 */
function getTrieConstructor(client: OrigApolloClient<unknown>) {
  return getQueryManager(client)["inFlightLinkObservables"]
    .constructor as typeof Trie;
}

type Cade<T> =
  | (ReadableStreamReadValueResult<T> & { next: Promiscade<T> })
  | ReadableStreamReadDoneResult<undefined>;
type Promiscade<T> = Promise<Cade<T>>;

type SimulatedQueryInfo = {
  resolve: (result: Cade<FetchResult>) => void;
  reject: (reason: any) => void;
  options: WatchQueryOptions<OperationVariables, any>;
};

interface WrappedApolloClientOptions
  extends Omit<
    ApolloClientOptions<NormalizedCacheObject>,
    "cache" | "ssrMode" | "ssrForceFetchDelay"
  > {
  cache: InMemoryCache;
}

const wrappers = Symbol.for("apollo.hook.wrappers");
class ApolloClientBase extends OrigApolloClient<NormalizedCacheObject> {
  /**
   * Information about the current package and it's export names, for use in error messages.
   *
   * @internal
   */
  static readonly info = bundle;

  [sourceSymbol]: string;

  constructor(options: WrappedApolloClientOptions) {
    const warnings: string[] = [];
    if ("ssrMode" in options) {
      delete options.ssrMode;
      warnings.push(
        "The `ssrMode` option is not supported in %s. Please remove it from your %s constructor options."
      );
    }
    if ("ssrForceFetchDelay" in options) {
      delete options.ssrForceFetchDelay;
      warnings.push(
        "The `ssrForceFetchDelay` option is not supported in %s. Please remove it from your %s constructor options."
      );
    }
    super(
      process.env.REACT_ENV === "rsc" || process.env.REACT_ENV === "ssr"
        ? {
            connectToDevTools: false,
            ...options,
          }
        : options
    );
    const info = (this.constructor as typeof ApolloClientBase).info;
    this[sourceSymbol] = `${info.pkg}:ApolloClient`;

    for (const warning of warnings) {
      console.warn(warning, info.pkg, "ApolloClient");
    }

    assertInstance(
      this.cache as unknown as InMemoryCache,
      info,
      "InMemoryCache"
    );
  }
}

class ApolloClientClientBaseImpl extends ApolloClientBase {
  constructor(options: WrappedApolloClientOptions) {
    super(options);
    this.onQueryStarted = this.onQueryStarted.bind(this);

    getQueryManager(this)[wrappers] = hookWrappers;
  }

  private simulatedStreamingQueries = new Map<
    TransportIdentifier,
    SimulatedQueryInfo
  >();
  private transportedQueryOptions = new Map<
    TransportIdentifier,
    WatchQueryOptions
  >();

  protected identifyUniqueQuery(options: {
    query: DocumentNode;
    variables?: unknown;
  }) {
    const transformedDocument = this.documentTransform.transformDocument(
      options.query
    );
    const queryManager = getQueryManager(this);
    // Calling `transformDocument` will add __typename but won't remove client
    // directives, so we need to get the `serverQuery`.
    const { serverQuery } = queryManager.getDocumentInfo(transformedDocument);

    if (!serverQuery) {
      throw new Error("could not identify unique query");
    }

    const canonicalVariables = canonicalStringify(options.variables || {});

    const cacheKeyArr = [print(serverQuery), canonicalVariables];
    const cacheKey = JSON.stringify(cacheKeyArr);

    return {
      cacheKey,
      cacheKeyArr,
    };
  }

  onQueryStarted({ options, id }: Extract<QueryEvent, { type: "started" }>) {
    const hydratedOptions = deserializeOptions(options);
    const { cacheKey, cacheKeyArr } = this.identifyUniqueQuery(hydratedOptions);
    this.transportedQueryOptions.set(id, hydratedOptions);

    const queryManager = getQueryManager(this);

    if (
      !queryManager["inFlightLinkObservables"].peekArray(cacheKeyArr)
        ?.observable
    ) {
      let simulatedStreamingQuery: SimulatedQueryInfo,
        fetchCancelFn: (reason: unknown) => void;

      const cleanup = () => {
        if (queryManager["fetchCancelFns"].get(cacheKey) === fetchCancelFn)
          queryManager["fetchCancelFns"].delete(cacheKey);

        queryManager["inFlightLinkObservables"].removeArray(cacheKeyArr);

        if (this.simulatedStreamingQueries.get(id) === simulatedStreamingQuery)
          this.simulatedStreamingQueries.delete(id);
      };

      const promise = new Promise<Cade<FetchResult>>((resolve, reject) => {
        this.simulatedStreamingQueries.set(
          id,
          (simulatedStreamingQuery = {
            resolve,
            reject,
            options: hydratedOptions,
          })
        );
      });

      const observable = new Observable<FetchResult>((observer) => {
        function handleValue(result: Cade<FetchResult>) {
          if (result.done) {
            cleanup();
            observer.complete();
          } else {
            observer.next(result.value);
            result.next.then(handleValue, handleError);
          }
        }
        function handleError(err: unknown) {
          cleanup();
          observer.error(err);
        }

        promise.then(handleValue, handleError);
      });

      queryManager["inFlightLinkObservables"].lookupArray(
        cacheKeyArr
      ).observable = observable;

      queryManager["fetchCancelFns"].set(
        cacheKey,
        (fetchCancelFn = (reason: unknown) => {
          const { reject } = this.simulatedStreamingQueries.get(id) ?? {};
          if (reject) {
            reject(reason);
          }
          cleanup();
        })
      );
    }
  }

  onQueryProgress = (event: ProgressEvent) => {
    const queryInfo = this.simulatedStreamingQueries.get(event.id);

    if (event.type === "data") {
      if (queryInfo) {
        const next = Promise.withResolvers<Cade<FetchResult>>();
        const resolveCurrent = queryInfo.resolve;
        queryInfo.resolve = next.resolve;
        queryInfo.reject = next.reject;
        resolveCurrent({
          value: event.result,
          next: next.promise,
          done: false,
        });
      }

      // In order to avoid a scenario where the promise resolves without
      // a query subscribing to the promise, we immediately call
      // `cache.write` here.
      // For more information, see: https://github.com/apollographql/apollo-client-nextjs/pull/38/files/388813a16e2ac5c62408923a1face9ae9417d92a#r1229870523
      const options = this.transportedQueryOptions.get(event.id);
      if (options) {
        this.cache.writeQuery({
          query: options.query,
          data: event.result.data,
          variables: options.variables,
        });
      }
    } else if (event.type === "error") {
      /**
       * At this point we're not able to correctly serialize the error over the wire
       * so we do the next-best thing: restart the query in the browser as soon as it
       * failed on the server.
       * This matches up with what React will be doing (abort hydration and rerender)
       * See https://github.com/apollographql/apollo-client-nextjs/issues/52
       */
      if (queryInfo) {
        this.simulatedStreamingQueries.delete(event.id);
        if (process.env.REACT_ENV === "browser") {
          invariant.debug(
            "Query failed on server, rerunning in browser:",
            queryInfo.options
          );
          this.rerunSimulatedQuery(queryInfo);
        } else if (process.env.REACT_ENV === "ssr") {
          invariant.debug(
            "Query failed upstream, will fail it during SSR and rerun it in the browser:",
            queryInfo.options
          );
          queryInfo?.reject?.(new Error("Query failed upstream."));
        }
      }
      this.transportedQueryOptions.delete(event.id);
    } else if (event.type === "complete") {
      queryInfo?.resolve?.({ done: true });
      this.transportedQueryOptions.delete(event.id);
    }
  };

  /**
   * Can be called when the stream closed unexpectedly while there might still be unresolved
   * simulated server-side queries going on.
   * Those queries will be cancelled and then re-run in the browser.
   */
  rerunSimulatedQueries = () => {
    for (const [id, queryInfo] of this.simulatedStreamingQueries) {
      this.simulatedStreamingQueries.delete(id);
      invariant.debug(
        "streaming connection closed before server query could be fully transported, rerunning:",
        queryInfo.options
      );
      this.rerunSimulatedQuery(queryInfo);
    }
  };
  rerunSimulatedQuery = (queryInfo: SimulatedQueryInfo) => {
    const queryManager = getQueryManager(this);
    const queryId = queryManager.generateQueryId();
    queryManager
      .fetchQuery(queryId, {
        ...queryInfo.options,
        query: queryManager.transform(queryInfo.options.query),
        context: {
          ...queryInfo.options.context,
          queryDeduplication: false,
        },
      })
      .finally(() => queryManager.stopQuery(queryId))
      .then(() => queryInfo.resolve({ done: true }), queryInfo.reject);
  };
}

const skipDataTransportKey = Symbol.for("apollo.dataTransport.skip");
interface InternalContext {
  [skipDataTransportKey]?: boolean;
}

/**
 * Apply to a context to prevent this operation from being transported over the SSR data transport mechanism.
 * @param readableStream
 * @param context
 * @returns
 */
export function skipDataTransport<T extends Record<string, any>>(
  context: T
): T & InternalContext {
  return Object.assign(context, {
    [skipDataTransportKey]: true,
  });
}

class ApolloClientSSRImpl extends ApolloClientClientBaseImpl {
  private forwardedQueries = new (getTrieConstructor(this))();

  constructor(options: WrappedApolloClientOptions) {
    super(options);
    this.setLink(this.link);
  }

  setLink(newLink: ApolloLink) {
    super.setLink.call(
      this,
      ApolloLink.from([
        new ReadFromReadableStreamLink(),
        new TeeToReadableStreamLink(),
        newLink,
      ])
    );
  }

  watchQueryQueue = createBackpressuredCallback<{
    event: Extract<QueryEvent, { type: "started" }>;
    observable: Observable<Exclude<QueryEvent, { type: "started" }>>;
  }>();

  watchQuery<
    T = any,
    TVariables extends OperationVariables = OperationVariables,
  >(options: WatchQueryOptions<TVariables, T>) {
    const { cacheKeyArr } = this.identifyUniqueQuery(options);

    if (
      options.fetchPolicy !== "cache-only" &&
      options.fetchPolicy !== "standby" &&
      !(options.context as InternalContext | undefined)?.[
        skipDataTransportKey
      ] &&
      !this.forwardedQueries.peekArray(cacheKeyArr)
    ) {
      // don't transport the same query over twice
      this.forwardedQueries.lookupArray(cacheKeyArr);
      const observableQuery = super.watchQuery(options);
      const queryInfo = observableQuery["queryInfo"] as QueryInfo;
      const id = queryInfo.queryId as TransportIdentifier;

      const streamObservable = new Observable<
        Exclude<QueryEvent, { type: "started" }>
      >((subscriber) => {
        const { markResult, markError } = queryInfo;
        queryInfo.markResult = function (result: FetchResult<any>) {
          subscriber.next({
            type: "data",
            id,
            result,
          });
          if (!("hasNext" in result) || !result.hasNext) {
            subscriber.next({
              type: "complete",
              id,
            });
            subscriber.complete();
          }
          return markResult.apply(queryInfo, arguments as any);
        };
        queryInfo.markError = function () {
          subscriber.next({
            type: "error",
            id,
          });
          subscriber.complete();
          return markError.apply(queryInfo, arguments as any);
        };
      });

      this.watchQueryQueue.push({
        event: {
          type: "started",
          options: serializeOptions(options),
          id,
        },
        observable: streamObservable,
      });
      return observableQuery;
    }
    return super.watchQuery(options);
  }

  onQueryStarted(event: Extract<QueryEvent, { type: "started" }>) {
    const hydratedOptions = deserializeOptions(event.options);
    const { cacheKeyArr } = this.identifyUniqueQuery(hydratedOptions);
    // this is a replay from another source and doesn't need to be transported
    // to the browser, since it will be replayed there, too.
    this.forwardedQueries.lookupArray(cacheKeyArr);
    super.onQueryStarted(event);
  }
}

export class ApolloClientBrowserImpl extends ApolloClientClientBaseImpl {
  constructor(options: WrappedApolloClientOptions) {
    super(options);
    this.setLink(this.link);
  }

  setLink(newLink: ApolloLink) {
    super.setLink.call(this, new ReadFromReadableStreamLink().concat(newLink));
  }
}

class ApolloClientRSCImpl extends ApolloClientBase {
  constructor(options: WrappedApolloClientOptions) {
    super(options);
    this.setLink(this.link);
  }

  setLink(newLink: ApolloLink) {
    super.setLink.call(this, new TeeToReadableStreamLink().concat(newLink));
  }
}

const ApolloClientImplementation =
  /*#__PURE__*/ process.env.REACT_ENV === "ssr"
    ? ApolloClientSSRImpl
    : process.env.REACT_ENV === "browser"
      ? ApolloClientBrowserImpl
      : ApolloClientRSCImpl;

/**
 * A version of `ApolloClient` to be used with streaming SSR or in React Server Components.
 *
 * For more documentation, please see {@link https://www.apollographql.com/docs/react/api/core/ApolloClient | the Apollo Client API documentation}.
 *
 * @public
 */
export class ApolloClient<
    // this generic is obsolete as we require a `InMemoryStore`, which fixes this generic to `NormalizedCacheObject` anyways
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Ignored = NormalizedCacheObject,
  >
  extends (ApolloClientImplementation as typeof ApolloClientBase)
  implements Partial<ApolloClientBrowserImpl>, Partial<ApolloClientSSRImpl>
{
  /** @internal */
  declare onQueryStarted?: ApolloClientBrowserImpl["onQueryStarted"];
  /** @internal */
  declare onQueryProgress?: ApolloClientBrowserImpl["onQueryProgress"];
  /** @internal */
  declare rerunSimulatedQueries?: ApolloClientBrowserImpl["rerunSimulatedQueries"];
  /** @internal */
  declare rerunSimulatedQuery?: ApolloClientBrowserImpl["rerunSimulatedQuery"];
  /** @internal */
  declare watchQueryQueue?: ApolloClientSSRImpl["watchQueryQueue"];
}
