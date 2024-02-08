import type { SuperJSONResult } from "superjson";
import type { DataTransport } from "./dataTransport.js";

declare global {
  interface Window {
    [ApolloSSRDataTransport]?: DataTransport<SuperJSONResult>;
  }
}
export const ApolloSSRDataTransport = /*#__PURE__*/ Symbol.for(
  "ApolloSSRDataTransport"
);
