import type { DataTransport } from "./dataTransport.js";

declare global {
  interface Window {
    [ApolloSSRDataTransport]?: DataTransport<unknown>;
  }
}
export const ApolloSSRDataTransport = /*#__PURE__*/ Symbol.for(
  "ApolloSSRDataTransport"
);
