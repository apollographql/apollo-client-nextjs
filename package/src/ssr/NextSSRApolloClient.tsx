import {
  ApolloClient,
  ApolloClientOptions,
  OperationVariables,
  WatchQueryOptions,
  Observable,
  FetchResult,
  DocumentNode,
  DocumentTransform,
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

const seenDocuments = new Map<string, DocumentNode>();

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
  > & { uninitialized?: boolean } = {
    incomingBackgroundQueries: [],
    uninitialized: true,
  };

  constructor(options: ApolloClientOptions<TCacheShape>) {
    super({
      ...options,
      // TODO: the memoization in `documentTransform` can be removed once
      // https://github.com/apollographql/apollo-client/pull/10968 is merged.
      documentTransform: new DocumentTransform((document) => {
        const stringified = print(document);
        if (seenDocuments.has(stringified)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return seenDocuments.get(stringified)!;
        }
        seenDocuments.set(stringified, document);
        return document;
      }),
    });

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

    const canonicalVariables = canonicalStringify(options.variables);

    const cacheKey = [serverQuery, canonicalVariables].toString();

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

            const queryManager = getQueryManager<TCacheShape>(this);
            const byVariables =
              queryManager["inFlightLinkObservables"].get(query) || new Map();

            queryManager["inFlightLinkObservables"].set(query, byVariables);

            if (!byVariables.has(varJson)) {
              const promise = new Promise<FetchResult>((resolve, reject) => {
                this.resolveFakeQueries.set(cacheKey, [resolve, reject]);
              });

              byVariables.set(
                varJson,
                new Observable<FetchResult>((observer) => {
                  promise
                    .then((result) => {
                      observer.next(result);
                      observer.complete();
                    })
                    .catch((err) => {
                      observer.error(err);
                    });
                })
              );
              const queryManager = getQueryManager<TCacheShape>(this);
              const cleanupCancelFn = () =>
                queryManager["fetchCancelFns"].delete(cacheKey);

              const [_, reject] = this.resolveFakeQueries.get(cacheKey) ?? [];

              queryManager["fetchCancelFns"].set(
                cacheKey,
                (reason: unknown) => {
                  cleanupCancelFn();
                  if (reject) {
                    this.resolveFakeQueries.delete(cacheKey);
                    reject(reason);
                  }
                }
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
            this.resolveFakeQueries.delete(cacheKey);
          }
        });
      }
    }
  }

  watchQuery<
    T = any,
    TVariables extends OperationVariables = OperationVariables
  >(options: WatchQueryOptions<TVariables, T>) {
    if (typeof window == "undefined") {
      this.rehydrationContext.incomingBackgroundQueries.push(options);
    }
    const result = super.watchQuery(options);
    return result;
  }

  setRehydrationContext(rehydrationContext: RehydrationContextValue) {
    if (this.rehydrationContext.uninitialized) {
      rehydrationContext.incomingBackgroundQueries.push(
        ...this.rehydrationContext.incomingBackgroundQueries
      );
    }
    this.rehydrationContext = rehydrationContext;
    this.rehydrationContext.uninitialized = false;
  }
}
