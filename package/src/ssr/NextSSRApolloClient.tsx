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
import { print } from "graphql";
// import { canUseWeakMap } from "@apollo/client/utilities";
import { canonicalStringify } from "@apollo/client/cache";
import { RehydrationContextValue } from "./types";
import { registerLateInitializingQueue } from "./lateInitializingQueue";
import {
  ApolloBackgroundQueryTransport,
  ApolloResultCache,
} from "./ApolloRehydrateSymbols";

// uBQ: we want to skip it in the browser until data comes in
// the first time it renders on the client, if we don't yet have data,
// we tell it to wait for the existing request
// watchQuery:
//    watchQuery on the server doesn't do anything new except transport to the
//    client which query + variables are in flight
// on the client - the data comes in, creates the fake in-flight observable to
// force the cache to wait for the pending request

const seenDocuments = new Map<string, DocumentNode>();

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
  private resolveFakeQueries = new Map<string, (result: FetchResult) => void>();

  private identifyUniqueQuery(options: {
    query: DocumentNode;
    variables?: unknown;
  }) {
    const transformedDocument = this.documentTransform.transformDocument(
      options.query
    );

    // doc transforms will add __typename but won't remove directives
    // need to pass the result of transformed document into
    const { serverQuery } =
      this["queryManager"].getDocumentInfo(transformedDocument);

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
            console.log("cb 1");

            const { query, varJson, cacheKey } =
              this.identifyUniqueQuery(options);

            const byVariables =
              this["queryManager"].inFlightLinkObservables.get(query) ||
              new Map();

            this["queryManager"].inFlightLinkObservables.set(
              query,
              byVariables
            );

            if (!byVariables.has(varJson)) {
              console.log("adding myself");
              const promise = new Promise<FetchResult>((r) => {
                this.resolveFakeQueries.set(cacheKey, r);
              });

              byVariables.set(
                varJson,
                new Observable<FetchResult>((observer) => {
                  promise.then((result) => {
                    console.log("resolving fake query with result", result);
                    observer.next(result);
                    observer.complete();
                  });
                })
              );
            }
          }
        );
      }

      if (Array.isArray(window[ApolloResultCache] || [])) {
        registerLateInitializingQueue(ApolloResultCache, (data) => {
          console.log("cb 2", data);

          const { cacheKey } = this.identifyUniqueQuery(data);
          const resolve = this.resolveFakeQueries.get(cacheKey);
          if (resolve) {
            console.log("resolving", data);
            resolve({
              data: data.result,
            });
            this.resolveFakeQueries.delete(cacheKey);
          }
        });
      }
    }
  }

  // cache has the queue of incoming results
  // instead of calling this.write in the nextssrinmemorycache, we'd resolve the
  // fake observable with the real result data
  watchQuery<
    T = any,
    TVariables extends OperationVariables = OperationVariables
  >(options: WatchQueryOptions<TVariables, T>) {
    console.log("watchQuery, before", [
      ...this["queryManager"].inFlightLinkObservables.entries(),
    ]);
    if (typeof window == "undefined") {
      console.log("watchQuery server");
      this.rehydrationContext.incomingBackgroundQueries.push(options);
    }

    const result = super.watchQuery(options);
    console.log("watchQuery, after", [
      ...this["queryManager"].inFlightLinkObservables.entries(),
    ]);
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
