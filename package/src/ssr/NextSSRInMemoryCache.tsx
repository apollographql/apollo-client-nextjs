import {
  InMemoryCache,
  InMemoryCacheConfig,
  Cache,
  Reference,
} from "@apollo/client";
import { ApolloResultCache } from "./ApolloRehydrateSymbols";
import { RehydrationContextValue, ResultsCache } from "./types";

export class NextSSRInMemoryCache extends InMemoryCache {
  private incomingResults: ResultsCache = [];
  constructor(config?: InMemoryCacheConfig) {
    super(config);

    this.registerWindowHook();
  }
  private registerWindowHook() {
    if (typeof window !== "undefined") {
      const dataToDate = window[ApolloResultCache] || [];
      // eslint-disable-next-line @typescript-eslint/no-this-alias -- for readability
      const cache = this;
      if (Array.isArray(dataToDate)) {
        (window[ApolloResultCache] = {
          push: (...results) => {
            for (const result of results) {
              console.log(
                performance.now() + "ms new result from SSR: ",
                result
              );
              cache.write(result);
            }
          },
        }).push(...dataToDate);
      } else {
        throw new Error(
          "On the client side, only one instance of `NextSSRInMemoryCache` can be created!"
        );
      }
    }
  }

  write(options: Cache.WriteOptions<any, any>): Reference | undefined {
    if (typeof window == "undefined") {
      this.incomingResults.push(options);
    }
    return super.write(options);
  }

  setRehydrationContext(rehydrationContext: RehydrationContextValue) {
    if (Array.isArray(this.incomingResults)) {
      rehydrationContext.incomingResults.push(...this.incomingResults);
    }
    this.incomingResults = rehydrationContext.incomingResults;
  }
}
