import { Trie } from "@wry/trie";
import {
  ApolloClient,
  ApolloClientOptions,
  OperationVariables,
  WatchQueryOptions,
} from "@apollo/client";
import { canUseWeakMap } from "@apollo/client/utilities";
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

  private backgroundQueriesAndResults = new Map<any[], any>();

  constructor(options: ApolloClientOptions<TCacheShape>) {
    super(options);

    this.registerWindowHook();
  }
  private cacheKeys = new Trie<any[]>(
    canUseWeakMap,
    (cacheKey: any[]) => cacheKey
  );
  private registerWindowHook() {
    let stableCacheKey: any[] | undefined;
    if (typeof window !== "undefined") {
      // shared variables - could be a trie

      if (Array.isArray(window[ApolloBackgroundQueryTransport] || [])) {
        console.log("background query transport");
        registerLateInitializingQueue(
          ApolloBackgroundQueryTransport,
          (options) => {
            const cacheKey = [
              options.query,
              canonicalStringify(options.variables),
            ].concat();

            stableCacheKey = this.cacheKeys.lookupArray(cacheKey);

            // instead of null, set an observable in the map...
            this.backgroundQueriesAndResults.set(stableCacheKey, "testing 123");
          }
        );
      }

      if (Array.isArray(window[ApolloResultCache] || [])) {
        console.log("result cache");
        registerLateInitializingQueue(ApolloResultCache, (data) => {
          console.log("cb 2", data);
          if (stableCacheKey) {
            console.log(this.backgroundQueriesAndResults.get(stableCacheKey));
            // call obserable with result
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
    if (typeof window == "undefined") {
      // @ts-ignore
      this.rehydrationContext.incomingBackgroundQueries.push(options);
    }
    if (typeof window !== "undefined") {
      console.log("inside watchQuery");
    }
    return super.watchQuery(options);
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
