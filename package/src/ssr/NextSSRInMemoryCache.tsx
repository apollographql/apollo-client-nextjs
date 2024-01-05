import type {
  InMemoryCacheConfig,
  Cache,
  Reference} from "@apollo/client";
import {
  InMemoryCache
} from "@apollo/client";
import type { RehydrationContextValue } from "./types";

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
