import {
  ObservableQuery,
  ApolloClient,
  ApolloClientOptions,
  OperationVariables,
  WatchQueryOptions,
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

  private registerWindowHook() {
    if (typeof window !== "undefined") {
      if (Array.isArray(window[ApolloBackgroundQueryTransport] || [])) {
        registerLateInitializingQueue(
          ApolloBackgroundQueryTransport,
          (options) => {
            console.log("cb 1");

            const transformedDocument =
              this.documentTransform.transformDocument(options.query);

            // doc transforms will add __typename but won't remove directives
            // need to pass the result of transformed document into
            const { serverQuery } =
              this["queryManager"].getDocumentInfo(transformedDocument);

            // ^ this has a property called serverQuery -> this will be stripped
            // of directives incl defer, nonreactive, connection, etc.
            const cacheKey = [
              serverQuery,
              canonicalStringify(options.variables),
            ].toString();

            const queryId = this["queryManager"].generateQueryId();
            const queryInfo = this["queryManager"].getQuery(queryId).init({
              document: options.query,
              variables: options.variables,
            });
            const observable = new ObservableQuery({
              queryManager: this["queryManager"],
              queryInfo,
              options,
            });
            this.resolveFakeQueries.set(cacheKey, observable);
            // const byVariables =
            //   this["queryManager"].inFlightLinkObservables.get(serverQuery) ||
            //   new Map();

            // this["queryManager"].inFlightLinkObservables.set(
            //   serverQuery,
            //   byVariables
            // );

            console.log(print(options.query));
          }
        );
      }

      if (Array.isArray(window[ApolloResultCache] || [])) {
        registerLateInitializingQueue(ApolloResultCache, (data) => {
          console.log("cb 2", data);

          const transformedDocument = this.documentTransform.transformDocument(
            data.query
          );

          const { serverQuery } =
            this["queryManager"].getDocumentInfo(transformedDocument);

          const cacheKey = [
            serverQuery,
            canonicalStringify(data.variables),
          ].toString();

          const fakeObservable = this.resolveFakeQueries.get(cacheKey);
          // console.log(this.resolveFakeQueries.get(cacheKey));
          console.log("result", data.result, fakeObservable);
          fakeObservable.updateLastResult(data.result);

          // call observable with result
          console.log(data.result);
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
      console.log("watchQuery server");
      // @ts-ignore
      this.rehydrationContext.incomingBackgroundQueries.push(options);
      return super.watchQuery(options);
    }
    console.log(
      "watchQuery",
      this.rehydrationContext.incomingBackgroundQueries
    );
    // const transformedDocument = this.documentTransform.transformDocument(
    //   options.query
    // );

    // const { serverQuery } =
    //   this["queryManager"].getDocumentInfo(transformedDocument);

    // const cacheKey = [
    //   serverQuery,
    //   canonicalStringify(options.variables),
    // ].toString();

    // const fakeObservable = this.resolveFakeQueries.get(cacheKey);
    // console.log({ fakeObservable });

    // if (typeof window !== "undefined" && fakeObservable) {
    //   console.log("inside return fake obs");
    //   return fakeObservable;
    // }
    // if the query + variables are in this.resolveFakeQueries
    // return the fake ObservableQuery

    // const queryId = this["queryManager"].generateQueryId();
    const queryId = "FOO";
    const queryInfo = this["queryManager"].getQuery(queryId).init({
      document: options.query,
      variables: options.variables,
    });
    const observable = new ObservableQuery({
      queryManager: this["queryManager"],
      queryInfo,
      options,
    });
    console.log("returning obs");
    // this["queryManager"].fetchConcastWithInfo = () => {
    //   console.log("doo doo");
    // };
    return observable;
    // return super.watchQuery(options);
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
