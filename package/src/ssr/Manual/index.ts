export { buildManualDataTransport } from "./ManualDataTransport";

import { ApolloSSRDataTransport } from "./ApolloRehydrateSymbols";
import { resetApolloSingletons } from "../testHelpers";

/**
 * Resets the singleton instances created for the Apollo SSR data transport and caches.
 *
 * To be used in testing only, like
 * ```ts
 * afterEach(resetNextSSRApolloSingletons);
 * ```
 */
export function resetManualSSRApolloSingletons() {
  resetApolloSingletons();
  delete window[ApolloSSRDataTransport];
}
