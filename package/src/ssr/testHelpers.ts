import { ApolloRehydrationCache, ApolloResultCache, ApolloSSRDataTransport } from "./ApolloRehydrateSymbols";

/**
 * Resets the singleton instances created for the Apollo SSR data transport and caches.
 * 
 * To be used in testing only, like
 * ```ts
 * afterEach(resetNextSSRApolloSingletons);
 * ```
 */
export function resetNextSSRApolloSingletons(){
    delete window[ApolloRehydrationCache];
    delete window[ApolloResultCache];
    delete window[ApolloSSRDataTransport];
}