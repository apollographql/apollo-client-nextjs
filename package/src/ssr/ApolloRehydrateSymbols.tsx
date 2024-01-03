import type { SuperJSONResult } from "superjson/dist/types";
import type {
  RehydrationCache,
  ResultsCache,
  BackgroundQueriesCache,
} from "./types";
import type { DataTransport } from "./dataTransport";

declare global {
  interface Window {
    [ApolloRehydrationCache]?: RehydrationCache;
    [ApolloResultCache]?: ResultsCache;
    [ApolloSSRDataTransport]?: DataTransport<SuperJSONResult>;
    [ApolloBackgroundQueryTransport]?: BackgroundQueriesCache;
  }
}
export const ApolloRehydrationCache = Symbol.for("ApolloRehydrationCache");
export const ApolloResultCache = Symbol.for("ApolloResultCache");
export const ApolloSSRDataTransport = Symbol.for("ApolloSSRDataTransport");
export const ApolloBackgroundQueryTransport = Symbol.for(
  "ApolloBackgroundQueryTransport"
);
