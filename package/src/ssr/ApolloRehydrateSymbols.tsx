import { SuperJSONResult } from "superjson/dist/types";
import { RehydrationCache, ResultsCache } from "./types";
import type { DataTransport } from "./dataTransport";

declare global {
  interface Window {
    [ApolloRehydrationCache]?: RehydrationCache;
    [ApolloResultCache]?: ResultsCache;
    [ApolloSSRDataTransport]?: DataTransport<SuperJSONResult>;
  }
}
export const ApolloRehydrationCache = Symbol.for("ApolloRehydrationCache");
export const ApolloResultCache = Symbol.for("ApolloResultCache");
export const ApolloSSRDataTransport = Symbol.for("ApolloSSRDataTransport");
