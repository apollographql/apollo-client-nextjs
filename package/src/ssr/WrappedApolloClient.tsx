import type {
  ApolloClientOptions,
  OperationVariables,
  WatchQueryOptions,
  FetchResult,
  DocumentNode,
  Cache,
} from "@apollo/client/index.js";
import { ApolloClient, Observable } from "@apollo/client/index.js";
import type { QueryManager } from "@apollo/client/core/QueryManager.js";
import { print } from "@apollo/client/utilities/index.js";
import { canonicalStringify } from "@apollo/client/cache/index.js";
import invariant from "ts-invariant";
import { createBackpressuredCallback } from "./backpressuredCallback.js";
import { WrappedInMemoryCache } from "./WrappedInMemoryCache.js";

function getQueryManager<TCacheShape>(
  client: ApolloClient<unknown>
): QueryManager<TCacheShape> {
  return client["queryManager"];
}

type SimulatedQueryInfo = {
  resolve: (result: FetchResult) => void;
  reject: (reason: any) => void;
  options: WatchQueryOptions<OperationVariables, any>;
};

class ApolloClientSSRImpl<TCacheShape> extends ApolloClient<TCacheShape> {
  watchQueryQueue = createBackpressuredCallback<WatchQueryOptions<any>>();

  constructor(options: ApolloClientOptions<TCacheShape>) {
    super(options);
  }

  watchQuery<
    T = any,
    TVariables extends OperationVariables = OperationVariables,
  >(options: WatchQueryOptions<TVariables, T>) {
    if (
      options.fetchPolicy !== "cache-only" &&
      options.fetchPolicy !== "standby"
    ) {
      this.watchQueryQueue.push(options);
    }
    return super.watchQuery(options);
  }
}

export class ApolloClientBrowserImpl<
  TCacheShape,
> extends ApolloClient<TCacheShape> {
  constructor(options: ApolloClientOptions<TCacheShape>) {
    super(options);

    if (!(this.cache instanceof WrappedInMemoryCache)) {
      throw new Error(
        "When using Apollo Client streaming SSR, you must use the `InMemoryCache` variant provided by the streaming package."
      );
    }
  }

  private simulatedStreamingQueries = new Map<string, SimulatedQueryInfo>();

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

  protected onRequestStarted = (options: WatchQueryOptions) => {
    const { query, varJson, cacheKey } = this.identifyUniqueQuery(options);

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

        if (
          this.simulatedStreamingQueries.get(cacheKey) ===
          simulatedStreamingQuery
        )
          this.simulatedStreamingQueries.delete(cacheKey);
      };

      const promise = new Promise<FetchResult>((resolve, reject) => {
        this.simulatedStreamingQueries.set(
          cacheKey,
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
          const { reject } = this.simulatedStreamingQueries.get(cacheKey) ?? {};
          if (reject) {
            reject(reason);
          }
          cleanup();
        })
      );
    }
  };

  protected onRequestData = (data: Cache.WriteOptions) => {
    const { cacheKey } = this.identifyUniqueQuery(data);
    const { resolve } = this.simulatedStreamingQueries.get(cacheKey) ?? {};

    if (resolve) {
      resolve({
        data: data.result,
      });
    }
    // In order to avoid a scenario where the promise resolves without
    // a query subscribing to the promise, we immediately call
    // `cache.write` here.
    // For more information, see: https://github.com/apollographql/apollo-client-nextjs/pull/38/files/388813a16e2ac5c62408923a1face9ae9417d92a#r1229870523
    this.cache.write(data);
  };

  /**
   * Can be called when the stream closed unexpectedly while there might still be unresolved
   * simulated server-side queries going on.
   * Those queries will be cancelled and then re-run in the browser.
   */
  protected rerunSimulatedQueries = () => {
    const queryManager = getQueryManager(this);
    for (const [cacheKey, queryInfo] of this.simulatedStreamingQueries) {
      this.simulatedStreamingQueries.delete(cacheKey);
      invariant.debug(
        "streaming connection closed before server query could be fully transported, rerunning:",
        queryInfo.options
      );
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
    }
  };
}

export type WrappedApolloClient<TCacheShape> = ApolloClient<TCacheShape> & {
  onRequestStarted?: ApolloClientBrowserImpl<TCacheShape>["onRequestStarted"];
  onRequestData?: ApolloClientBrowserImpl<TCacheShape>["onRequestData"];
  rerunSimulatedQueries?: ApolloClientBrowserImpl<TCacheShape>["rerunSimulatedQueries"];

  watchQueryQueue: {
    register?: (
      instance: ((options: Cache.WriteOptions<any, any>) => void) | null
    ) => void;
  };

  cache: WrappedInMemoryCache;
};

export const WrappedApolloClient: {
  new <TCacheShape>(
    options: ApolloClientOptions<TCacheShape>
  ): WrappedApolloClient<TCacheShape>;
} = /*#__PURE__*/ (
  process.env.REACT_ENV === "ssr"
    ? ApolloClientSSRImpl
    : ApolloClientBrowserImpl
) as any;
