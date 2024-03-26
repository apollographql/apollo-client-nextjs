export { buildManualDataTransport } from "./ManualDataTransport.js";

export type { HydrationContextOptions } from "./RehydrationContext.js";

import { ApolloSSRDataTransport } from "./ApolloRehydrateSymbols.js";
import { resetApolloSingletons } from "@apollo/client-react-streaming";

/**
 * > This export is only available in React Client Components
 *
 * Resets the singleton instances created for the Apollo SSR data transport and caches.
 *
 * To be used in testing only, like
 * ```ts
 * afterEach(resetManualSSRApolloSingletons);
 * ```
 *
 * @public
 */
export function resetManualSSRApolloSingletons() {
  resetApolloSingletons();
  delete window[ApolloSSRDataTransport];
}
