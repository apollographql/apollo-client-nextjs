import {
  ApolloClient,
  ApolloClientOptions,
  OperationVariables,
  WatchQueryOptions,
  Observable,
  FetchResult,
  DocumentNode,
} from "@apollo/client";
import type { QueryManager } from "@apollo/client/core/QueryManager";
import { print } from "graphql";
import { canonicalStringify } from "@apollo/client/cache";
import { RehydrationContextValue } from "./types";
import { registerLateInitializingQueue } from "./lateInitializingQueue";
import {
  ApolloBackgroundQueryTransport,
  ApolloResultCache,
} from "./ApolloRehydrateSymbols";
import invariant from "ts-invariant";

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

export class NextSSRApolloClient<
  TCacheShape
> extends ApolloClient<TCacheShape> {
  private rehydrationContext: Pick<
    RehydrationContextValue,
    "incomingBackgroundQueries"
  > = {
    incomingBackgroundQueries: [],
  };

  constructor(options: ApolloClientOptions<TCacheShape>) {
    super(options);

    this.registerWindowHook();
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

  private registerWindowHook() {
    if (typeof window !== "undefined") {
      if (Array.isArray(window[ApolloBackgroundQueryTransport] || [])) {
        registerLateInitializingQueue(
          ApolloBackgroundQueryTransport,
          (options) => {
            // we are not streaming anymore, so we should not simulate "server-side requests"
            if (document.readyState === "complete") return;

            const { query, varJson, cacheKey } =
              this.identifyUniqueQuery(options);

            if (!query) return;
            const printedServerQuery = print(query);
            const queryManager = getQueryManager<TCacheShape>(this);

            const byVariables =
              queryManager["inFlightLinkObservables"].get(printedServerQuery) ||
              new Map();

            queryManager["inFlightLinkObservables"].set(
              printedServerQuery,
              byVariables
            );

            if (!byVariables.has(varJson)) {
              let simulatedStreamingQuery: SimulatedQueryInfo,
                observable: Observable<FetchResult>,
                fetchCancelFn: (reason: unknown) => void;

              const cleanup = () => {
                if (
                  queryManager["fetchCancelFns"].get(cacheKey) === fetchCancelFn
                )
                  queryManager["fetchCancelFns"].delete(cacheKey);

                if (byVariables.get(varJson) === observable)
                  byVariables.delete(varJson);

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
              byVariables.set(
                varJson,
                (observable = new Observable<FetchResult>((observer) => {
                  promise
                    .then((result) => {
                      observer.next(result);
                      observer.complete();
                    })
                    .catch((err) => {
                      observer.error(err);
                    });
                }))
              );

              queryManager["fetchCancelFns"].set(
                cacheKey,
                (fetchCancelFn = (reason: unknown) => {
                  const { reject } =
                    this.simulatedStreamingQueries.get(cacheKey) ?? {};
                  if (reject) {
                    reject(reason);
                  }
                  cleanup();
                })
              );
            }
          }
        );
        if (document.readyState !== "complete") {
          const rerunSimulatedQueries = () => {
            const queryManager = getQueryManager(this);
            // streaming finished, so we need to refire all "server-side requests"
            // that are still not resolved on the browser side to make sure we have all the data
            for (const [cacheKey, queryInfo] of this
              .simulatedStreamingQueries) {
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
          // happens simulatenously to `readyState` changing to `"complete"`, see
          // https://html.spec.whatwg.org/multipage/parsing.html#the-end (step 9.1 and 9.5)
          window.addEventListener("load", rerunSimulatedQueries, {
            once: true,
          });
        }
      }

      if (Array.isArray(window[ApolloResultCache] || [])) {
        registerLateInitializingQueue(ApolloResultCache, (data) => {
          const { cacheKey } = this.identifyUniqueQuery(data);
          const { resolve } =
            this.simulatedStreamingQueries.get(cacheKey) ?? {};

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
        });
      }
    }
  }

  watchQuery<
    T = any,
    TVariables extends OperationVariables = OperationVariables
  >(options: WatchQueryOptions<TVariables, T>) {
    if (typeof window == "undefined") {
      if (
        options.fetchPolicy !== "cache-only" &&
        options.fetchPolicy !== "standby"
      ) {
        this.rehydrationContext.incomingBackgroundQueries.push(options);
      }
    }
    const result = super.watchQuery(options);
    return result;
  }

  setRehydrationContext(rehydrationContext: RehydrationContextValue) {
    if (
      rehydrationContext.incomingBackgroundQueries !==
      this.rehydrationContext.incomingBackgroundQueries
    )
      rehydrationContext.incomingBackgroundQueries.push(
        ...this.rehydrationContext.incomingBackgroundQueries.splice(0)
      );
    this.rehydrationContext = rehydrationContext;
  }
}
