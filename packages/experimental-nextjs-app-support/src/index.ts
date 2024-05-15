export * from "./index.shared.js";
export { ApolloNextAppProvider } from "./ApolloNextAppProvider.js";
import { resetManualSSRApolloSingletons } from "@apollo/client-react-streaming/manual-transport";
/**
 * > This export is only available in React Client Components
 *
 * Resets the singleton instances created for the Apollo SSR data transport and caches.
 *
 * To be used in testing only, like
 * ```ts
 * afterEach(resetApolloClientSingletons);
 * ```
 *
 * @public
 */
export const resetApolloClientSingletons = resetManualSSRApolloSingletons;
