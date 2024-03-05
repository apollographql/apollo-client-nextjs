/* eslint-disable prefer-rest-params */
import type {
  ApolloClientOptions,
  OperationVariables,
  WatchQueryOptions,
  FetchResult,
  DocumentNode,
} from "@apollo/client/index.js";
import {
  ApolloClient as OrigApolloClient,
  Observable,
} from "@apollo/client/index.js";
import type { QueryManager } from "@apollo/client/core/QueryManager.js";
import { print } from "@apollo/client/utilities/index.js";
import { canonicalStringify } from "@apollo/client/cache/index.js";
import { invariant } from "ts-invariant";
import { createBackpressuredCallback } from "./backpressuredCallback.js";
import { InMemoryCache } from "./WrappedInMemoryCache.js";
import { hookWrappers } from "./hooks.js";
import type { HookWrappers } from "@apollo/client/react/internal/index.js";
import type { QueryInfo } from "@apollo/client/core/QueryInfo.js";
import type {
  QueryEvent,
  TransportIdentifier,
} from "./DataTransportAbstraction.js";

function getQueryManager<TCacheShape>(
  client: OrigApolloClient<unknown>
): QueryManager<TCacheShape> & {
  [wrappers]: HookWrappers;
} {
  return client["queryManager"];
}

type SimulatedQueryInfo = {
  resolve: (result: FetchResult) => void;
  reject: (reason: any) => void;
  options: WatchQueryOptions<OperationVariables, any>;
};

const wrappers = Symbol.for("apollo.hook.wrappers");
class ApolloClientBase<TCacheShape> extends OrigApolloClient<TCacheShape> {
  constructor(options: ApolloClientOptions<TCacheShape>) {
    super(options);

    if (!(this.cache instanceof InMemoryCache)) {
      throw new Error(
        "When using Apollo Client streaming SSR, you must use the `InMemoryCache` variant provided by the streaming package."
      );
    }

    getQueryManager(this)[wrappers] = hookWrappers;
  }
}

class ApolloClientSSRImpl<TCacheShape> extends ApolloClientBase<TCacheShape> {
  watchQueryQueue = createBackpressuredCallback<{
    event: Extract<QueryEvent, { type: "started" }>;
    observable: Observable<Exclude<QueryEvent, { type: "started" }>>;
  }>();

  watchQuery<
    T = any,
    TVariables extends OperationVariables = OperationVariables,
  >(options: WatchQueryOptions<TVariables, T>) {
    if (
      options.fetchPolicy !== "cache-only" &&
      options.fetchPolicy !== "standby"
    ) {
      const observableQuery = super.watchQuery(options);
      const queryInfo = observableQuery["queryInfo"] as QueryInfo;
      const id = queryInfo.queryId as TransportIdentifier;

      const streamObservable = new Observable<
        Exclude<QueryEvent, { type: "started" }>
      >((subscriber) => {
        const { markResult, markError, markReady } = queryInfo;
        queryInfo.markResult = function (result: FetchResult<any>) {
          subscriber.next({
            type: "data",
            id,
            result: result,
          });
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
        queryInfo.markReady = function () {
          subscriber.next({
            type: "complete",
            id,
          });
          subscriber.complete();
          return markReady.apply(queryInfo, arguments as any);
        };
      });

      this.watchQueryQueue.push({
        event: {
          type: "started",
          options: options as WatchQueryOptions<any>,
          id,
        },
        observable: streamObservable,
      });
      return observableQuery;
    }
    return super.watchQuery(options);
  }
}

export class ApolloClientBrowserImpl<
  TCacheShape,
> extends ApolloClientBase<TCacheShape> {
  private simulatedStreamingQueries = new Map<
    TransportIdentifier,
    SimulatedQueryInfo
  >();
  private transportedQueryOptions = new Map<
    TransportIdentifier,
    WatchQueryOptions
  >();

  private identifyUniqueQuery(options: {
    query: DocumentNode;
    variables?: unknown;
  }) {
    const transformedDocument = this.documentTransform.transformDocument(
      options.query
    );
    const queryManager = getQueryManager<TCacheShape>(this);
    // Calling `transformDocument` will add __typename but won't remove client
    // directives, so we need to get the `serverQuery`.
    const { serverQuery } = queryManager.getDocumentInfo(transformedDocument);

    if (!serverQuery) {
      throw new Error("could not identify unique query");
    }

    const canonicalVariables = canonicalStringify(options.variables || {});

    const cacheKey = [print(serverQuery), canonicalVariables].toString();

    return { query: serverQuery, cacheKey, varJson: canonicalVariables };
  }

  onQueryStarted = ({
    options,
    id,
  }: Extract<QueryEvent, { type: "started" }>) => {
    const { query, varJson, cacheKey } = this.identifyUniqueQuery(options);
    this.transportedQueryOptions.set(id, options);

    if (!query) return;
    const printedServerQuery = print(query);
    const queryManager = getQueryManager<TCacheShape>(this);

    if (
      !queryManager["inFlightLinkObservables"].peek(printedServerQuery, varJson)
        ?.observable
    ) {
      let simulatedStreamingQuery: SimulatedQueryInfo,
        fetchCancelFn: (reason: unknown) => void;

      const cleanup = () => {
        if (queryManager["fetchCancelFns"].get(cacheKey) === fetchCancelFn)
          queryManager["fetchCancelFns"].delete(cacheKey);

        queryManager["inFlightLinkObservables"].remove(
          printedServerQuery,
          varJson
        );

        if (this.simulatedStreamingQueries.get(id) === simulatedStreamingQuery)
          this.simulatedStreamingQueries.delete(id);
      };

      const promise = new Promise<FetchResult>((resolve, reject) => {
        this.simulatedStreamingQueries.set(
          id,
          (simulatedStreamingQuery = { resolve, reject, options })
        );
      });

      promise.finally(cleanup);

      const observable = new Observable<FetchResult>((observer) => {
        promise
          .then((result) => {
            observer.next(result);
            observer.complete();
          })
          .catch((err) => {
            observer.error(err);
          });
      });

      queryManager["inFlightLinkObservables"].lookup(
        printedServerQuery,
        varJson
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
  };

  onQueryProgress = (event: Exclude<QueryEvent, { type: "started" }>) => {
    const queryInfo = this.simulatedStreamingQueries.get(event.id);

    if (event.type === "data") {
      queryInfo?.resolve?.({
        data: event.result.data,
      });

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
       * See https://github.com/apollographql/apollo-client-nextjs/issues/52
       */
      if (queryInfo) {
        invariant.debug(
          "query failed on server, rerunning in browser:",
          queryInfo.options
        );
        this.rerunSimulatedQuery(queryInfo);
      }
      this.transportedQueryOptions.delete(event.id);
    } else if (event.type === "complete") {
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
        context: {
          ...queryInfo.options.context,
          queryDeduplication: false,
        },
      })
      .finally(() => queryManager.stopQuery(queryId))
      .then(queryInfo.resolve, queryInfo.reject);
  };
}

export type ApolloClient<TCacheShape> = OrigApolloClient<TCacheShape> &
  Partial<ApolloClientBrowserImpl<TCacheShape>> &
  Partial<ApolloClientSSRImpl<TCacheShape>>;

export const ApolloClient: {
  new <TCacheShape>(
    options: ApolloClientOptions<TCacheShape>
  ): ApolloClient<TCacheShape>;
} = /*#__PURE__*/ (
  process.env.REACT_ENV === "ssr"
    ? ApolloClientSSRImpl
    : process.env.REACT_ENV === "browser"
      ? ApolloClientBrowserImpl
      : OrigApolloClient
) as any;
