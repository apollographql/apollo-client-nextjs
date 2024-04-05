import type { DataTransport, JSONResult } from "./dataTransport.js";

declare global {
  interface Window {
    [ApolloSSRDataTransport]?: DataTransport<JSONResult>;
  }
}
export const ApolloSSRDataTransport = /*#__PURE__*/ Symbol.for(
  "ApolloSSRDataTransport"
);
