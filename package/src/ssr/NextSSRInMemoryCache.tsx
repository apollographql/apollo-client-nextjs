import {
  InMemoryCache,
  InMemoryCacheConfig,
  Cache,
  Reference,
} from "@apollo/client";
import { RehydrationContextValue } from "./types";

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
    console.log("write");
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
