import { InMemoryCache as OrigInMemoryCache } from "@apollo/client/index.js";
/**
 * We just subclass `InMemoryCache` here so that `WrappedApolloClient`
 * can detect if it was initialized with an `InMemoryCache` instance that
 * was also exported from this package.
 * Right now, we don't have extra logic here, but we might have so again
 * in the future.
 * So we want to enforce this import path from the start to prevent future
 * subtle bugs if people update the package and don't read the patch notes.
 */
export class InMemoryCache extends OrigInMemoryCache {}
