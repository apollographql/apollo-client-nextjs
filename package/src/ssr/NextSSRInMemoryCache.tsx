import {
  InMemoryCache,
  InMemoryCacheConfig,
  Cache,
  Reference,
} from "@apollo/client";
import { ApolloResultCache } from "./ApolloRehydrateSymbols";
import { RehydrationContextValue } from "./types";
import { registerLateInitializingQueue } from "./lateInitializingQueue";

export class NextSSRInMemoryCache extends InMemoryCache {
  private rehydrationContext: Pick<
    RehydrationContextValue,
    "incomingResults"
  > & { uninitialized?: boolean } = {
    incomingResults: [],
    uninitialized: true,
  };
  constructor(config?: InMemoryCacheConfig) {
    super(config);

    this.registerWindowHook();
  }
  private registerWindowHook() {
    if (typeof window !== "undefined") {
      if (Array.isArray(window[ApolloResultCache] || [])) {
        registerLateInitializingQueue(ApolloResultCache, (data) =>
          this.write(data)
        );
      } else {
        throw new Error(
          "On the client side, only one instance of `NextSSRInMemoryCache` can be created!"
        );
      }
    }
  }

  write(options: Cache.WriteOptions<any, any>): Reference | undefined {
    if (typeof window == "undefined") {
      this.rehydrationContext.incomingResults.push(options);
    }
    return super.write(options);
  }

  setRehydrationContext(rehydrationContext: RehydrationContextValue) {
    if (this.rehydrationContext.uninitialized) {
      rehydrationContext.incomingResults.push(
        ...this.rehydrationContext.incomingResults
      );
    }
    this.rehydrationContext = rehydrationContext;
    this.rehydrationContext.uninitialized = false;
  }
}
