import type {
  InMemoryCacheConfig,
  Cache,
  Reference,
} from "@apollo/client/index.js";
import { InMemoryCache } from "@apollo/client/index.js";
import { createBackpressuredCallback } from "./backpressuredCallback.js";
import { ensureNotCalledFromUnwrappedHook } from "./ensureNotCalledFromUnwrappedHook.js";

class SharedInMemoryCache extends InMemoryCache {
  constructor(config?: InMemoryCacheConfig) {
    super(config);
  }

  watch<TData = any, TVariables = any>(
    watch: Cache.WatchOptions<TData, TVariables>
  ): () => void {
    ensureNotCalledFromUnwrappedHook();
    return super.watch(watch);
  }
}

class InMemoryCacheSSRImpl extends SharedInMemoryCache {
  protected writeQueue = createBackpressuredCallback<Cache.WriteOptions>();

  constructor(config?: InMemoryCacheConfig) {
    super(config);
  }
  write(options: Cache.WriteOptions<any, any>): Reference | undefined {
    this.writeQueue.push(options);
    return super.write(options);
  }
}

export type WrappedInMemoryCache = InMemoryCache & {
  writeQueue?: {
    register?: (
      instance: ((options: Cache.WriteOptions<any, any>) => void) | null
    ) => void;
  };
};

export const WrappedInMemoryCache: {
  new (config?: InMemoryCacheConfig): WrappedInMemoryCache;
} =
  /*#__PURE__*/ process.env.REACT_ENV === "ssr"
    ? InMemoryCacheSSRImpl
    : SharedInMemoryCache;
