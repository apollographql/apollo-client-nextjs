import { ApolloClientSingleton } from "./symbols.js";

/**
 * Resets the singleton instances created for the Apollo SSR data transport and caches.
 *
 * To be used in testing only, like
 * ```ts
 * afterEach(resetApolloSingletons);
 * ```
 */
export function resetApolloSingletons() {
  delete window[ApolloClientSingleton];
}
