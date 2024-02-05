import type { SuperJSONResult } from "superjson/dist/types";
import type { DataTransport } from "./dataTransport";

declare global {
  interface Window {
    [ApolloSSRDataTransport]?: DataTransport<SuperJSONResult>;
  }
}
export const ApolloSSRDataTransport = Symbol.for("ApolloSSRDataTransport");
