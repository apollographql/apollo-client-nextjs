import { ApolloClientSingleton } from "./symbols.js";

/**
 * > This export is only available in React Client Components
 *
 * Resets the singleton instances created for the Apollo SSR data transport and caches.
 *
 * To be used in testing only, like
 * ```ts
 * afterEach(resetApolloSingletons);
 * ```
 *
 * @public
 */
export function resetApolloSingletons() {
  delete window[ApolloClientSingleton];
}
