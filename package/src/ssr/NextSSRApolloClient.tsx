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

function getQueryManager<TCacheShape>(
  client: ApolloClient<unknown>
): QueryManager<TCacheShape> {
  return client["queryManager"];
}

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

  private resolveFakeQueries = new Map<
    string,
    [(result: FetchResult) => void, (reason: any) => void]
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

  private registerWindowHook() {
    if (typeof window !== "undefined") {
      if (Array.isArray(window[ApolloBackgroundQueryTransport] || [])) {
        registerLateInitializingQueue(
          ApolloBackgroundQueryTransport,
          (options) => {
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
              let resolveFakeQuery: [
                  (result: FetchResult) => void,
                  (reason: any) => void
                ],
                observable: Observable<FetchResult>,
                fetchCancelFn: (reason: unknown) => void;

              const cleanup = () => {
                if (
                  queryManager["fetchCancelFns"].get(cacheKey) === fetchCancelFn
                )
                  queryManager["fetchCancelFns"].delete(cacheKey);

                if (byVariables.get(varJson) === observable)
                  byVariables.delete(varJson);

                if (this.resolveFakeQueries.get(cacheKey) === resolveFakeQuery)
                  this.resolveFakeQueries.delete(cacheKey);
              };

              const promise = new Promise<FetchResult>((resolve, reject) => {
                this.resolveFakeQueries.set(
                  cacheKey,
                  (resolveFakeQuery = [resolve, reject])
                );
              });

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
                    })
                    .finally(cleanup);
                }))
              );

              queryManager["fetchCancelFns"].set(
                cacheKey,
                (fetchCancelFn = (reason: unknown) => {
                  const [_, reject] =
                    this.resolveFakeQueries.get(cacheKey) ?? [];
                  if (reject) {
                    reject(reason);
                  }
                  cleanup();
                })
              );
            }
          }
        );
      }

      if (Array.isArray(window[ApolloResultCache] || [])) {
        registerLateInitializingQueue(ApolloResultCache, (data) => {
          const { cacheKey } = this.identifyUniqueQuery(data);
          const [resolve] = this.resolveFakeQueries.get(cacheKey) ?? [];

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
