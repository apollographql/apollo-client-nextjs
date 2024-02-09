import type React from "react";
import type { Cache, WatchQueryOptions } from "@apollo/client/index.js";
import { createContext } from "rehackt";

interface DataTransportAbstraction {
  /**
   * This hook should always return the first value it was called with.
   *
   * If used in the browser and SSR happened, it should return the value passed to it on the server.
   */
  useStaticValueRef<T>(value: T): { current: T };
}

export const DataTransportContext =
  /*#__PURE__*/ createContext<DataTransportAbstraction | null>(null);

export type DataTransportProviderImplementation<
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtraProps = {},
> = React.FC<
  {
    /** will be present in the Browser */
    onRequestStarted?: (options: WatchQueryOptions) => void;
    /** will be present in the Browser */
    onRequestData?: (options: Cache.WriteOptions) => void;
    /** will be present in the Browser */
    rerunSimulatedQueries?: () => void;
    /** will be present during SSR */
    registerDispatchRequestStarted?: (
      callback: (options: WatchQueryOptions) => void
    ) => void;
    /** will be present during SSR */
    registerDispatchRequestData?: (
      callback: (options: Cache.WriteOptions) => void
    ) => void;
    /** will always be present */
    children: React.ReactNode;
  } & ExtraProps
>;
