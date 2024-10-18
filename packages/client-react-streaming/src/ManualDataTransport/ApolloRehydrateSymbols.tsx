import type { DataTransport } from "./dataTransport.js";
import type { RehydrationCache } from "./types.js";

declare global {
  interface Window {
    [ApolloSSRDataTransport]?: DataTransport<unknown>;
    [ApolloHookRehydrationCache]?: RehydrationCache;
  }
}
export const ApolloSSRDataTransport = /*#__PURE__*/ Symbol.for(
  "ApolloSSRDataTransport"
);

export const ApolloHookRehydrationCache = /*#__PURE__*/ Symbol.for(
  "apollo.hookRehydrationCache"
);
