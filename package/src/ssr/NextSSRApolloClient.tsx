import { Trie } from "@wry/trie";
import {
  Observable,
  ObservableQuery,
  ApolloClient,
  ApolloClientOptions,
  OperationVariables,
  WatchQueryOptions,
} from "@apollo/client";
import { print } from "graphql";
import { canUseWeakMap } from "@apollo/client/utilities";
import { QueryManager } from "@apollo/client/core/QueryManager";
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

  constructor(options: ApolloClientOptions<TCacheShape>) {
    super(options);

    this.registerWindowHook();
  }
  private resolveFakeQueries = new Map<string, any>();
  // private cacheKeys = new Trie<any[]>(
  //   canUseWeakMap,
  //   (cacheKey: any[]) => cacheKey
  // );
  private registerWindowHook() {
    // need to access this.QueryManager["inFlightLinkObservables"]

    // let stableCacheKey: any[] | undefined;
    if (typeof window !== "undefined") {
      if (Array.isArray(window[ApolloBackgroundQueryTransport] || [])) {
        registerLateInitializingQueue(
          ApolloBackgroundQueryTransport,
          (options) => {
            console.log("cb 1");
            // apply document transforms to add __typename up here
            // check with Jerel about applying the transform up here so we get
            // the same object back
            const cacheKey = [
              print(options.query),
              // canonicalStringify(options.variables),
            ].toString();

            // instead of null, set an observable in the map...
            this.resolveFakeQueries.set(cacheKey, "testing 123");
            console.log(print(options.query));
          }
        );
      }

      if (Array.isArray(window[ApolloResultCache] || [])) {
        registerLateInitializingQueue(ApolloResultCache, (data) => {
          console.log("cb 2", data);
          const cacheKey = [
            print(data.query),
            // canonicalStringify(data.variables),
          ].toString();
          // const stableCacheKey = this.cacheKeys.lookupArray(cacheKey);
          // if (stableCacheKey) {
          console.log(print(data.query));
          console.log([...this.resolveFakeQueries.keys()][0] === cacheKey);
          console.log(this.resolveFakeQueries.get(cacheKey));
          // call observable with result
          // }
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
    console.log("watchQuery");
    if (typeof window == "undefined") {
      console.log("watchQuery server");
      // @ts-ignore
      this.rehydrationContext.incomingBackgroundQueries.push(options);
    }
    // else if (
    //   typeof window !== "undefined" &&
    //   this.rehydrationContext.uninitialized
    // )
    // {
    //   // console.log(this.rehydrationContext.uninitialized);
    //   // console.log("inside watchQuery", options);
    //   const cacheKey = [
    //     options.query,
    //     canonicalStringify(options.variables),
    //   ].concat();
    //   const stableCacheKey = this.cacheKeys.lookupArray(cacheKey);
    //   this.resolveFakeQueries.set(stableCacheKey, "testing 123");
    //   // @ts-ignore
    //   // const observable: ObservableQuery<T, TVariables> = new Observable(
    //   //   (observer) => () => true
    //   // );
    //   // const observable = new ObservableQuery<T, TVariables>({
    //   //   queryManager: new QueryManager(),
    //   //   queryInfo,
    //   //   options,
    //   // });
    //   return observable;
    // } else {
    // }
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
