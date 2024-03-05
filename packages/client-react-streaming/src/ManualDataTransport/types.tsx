import type { Cache, WatchQueryOptions } from "@apollo/client/index.js";
import type React from "react";
import type { DataTransport } from "./dataTransport.js";
import type { QueryEvent } from "@apollo/client-react-streaming";

export type RehydrationCache = Record<string, unknown>;
export type ResultsCache = DataTransport<Cache.WriteOptions>;
export type BackgroundQueriesCache = DataTransport<WatchQueryOptions>;

export interface RehydrationContextValue {
  /**
   * The component that will be rendered by the `ServerInsertedHTMLHook`
   * to generate the code that will pass to the client.
   */
  RehydrateOnClient(): React.ReactElement;
  /**
   * Contains values that have been
   * passed into `useTransportValue` and already been
   * transported over to the client - the purpose of this
   * variable is to prevent the same data being sent over
   * again and again.
   * (TODO: Not used yet.)
   */
  transportedValues: RehydrationCache;
  /**
   * During SSR, this keeps values that
   * have been passed into `useTransportValue`.
   * Once that data is transported over to the client,
   * all transported values will be written to `transported`
   * and this variable is reset, to be filled with more values.
   */
  transportValueData: RehydrationCache;
  /**
   * Contains results that came in from a link that should
   * be replayed on the client.
   */
  incomingEvents: QueryEvent[];
  /**
   * Tracks if the `RehydrateOnClient` component is currently
   * injected into the `ServerInsertedHTMLHook`.
   */
  currentlyInjected: boolean;
}
