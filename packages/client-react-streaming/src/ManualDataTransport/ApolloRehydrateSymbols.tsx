// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore depending on the superjson version, this might not be right
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
