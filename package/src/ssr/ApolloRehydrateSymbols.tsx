import { RehydrationCache, ResultsCache } from "./types";

declare global {
  interface Window {
    [ApolloRehydrationCache]?: RehydrationCache;
    [ApolloResultCache]?: ResultsCache;
  }
}
export const ApolloRehydrationCache = Symbol.for("ApolloRehydrationCache");
export const ApolloResultCache = Symbol.for("ApolloResultCache");
