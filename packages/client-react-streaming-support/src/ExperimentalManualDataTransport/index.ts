export { buildManualDataTransport } from "./ManualDataTransport.js";

import { ApolloSSRDataTransport } from "./ApolloRehydrateSymbols.js";
import { resetApolloSingletons } from "../../../../client-react-streaming-support/src/DataTransportAbstraction/testHelpers.js";

/**
 * Resets the singleton instances created for the Apollo SSR data transport and caches.
 *
 * To be used in testing only, like
 * ```ts
 * afterEach(resetManualSSRApolloSingletons);
 * ```
 */
export function resetManualSSRApolloSingletons() {
  resetApolloSingletons();
  delete window[ApolloSSRDataTransport];
}
