/**
 * implementation to be used with the experimental React hooks implemented in
 * https://github.com/facebook/react/compare/main...phryneas:react:stream-injection
 */

import React, {
  useMemo,
  useActionChannel,
  useStaticValue,
  useRef,
} from "rehackt";
import type { DataTransportProviderImplementation } from "@apollo/client-react-streaming-support";
import { DataTransportContext } from "@apollo/client-react-streaming-support";
import type { Cache, WatchQueryOptions } from "@apollo/client/index.js";

declare module "react" {
  const useActionChannel: <T>(onData: (data: T) => void) => (data: T) => void;
  /**
   * This api design lends itself to a memory leak - the value passed in here
   * can never be removed from memory.
   * Maybe going with a ref-like object as a return value is a better choice
   * here.
   */
  const useStaticValue: <T>(data: T) => T;
}

export const ExperimentalReactDataTransport: DataTransportProviderImplementation =
  ({
    onRequestData,
    onRequestStarted,
    registerDispatchRequestStarted,
    registerDispatchRequestData,
    children,
  }) => {
    const dispatchRequestStarted = useActionChannel(
      (options: WatchQueryOptions) => {
        onRequestStarted?.(options);
      }
    );
    const dispatchRequestData = useActionChannel(
      (options: Cache.WriteOptions) => {
        onRequestData?.(options);
      }
    );
    registerDispatchRequestStarted?.(dispatchRequestStarted);
    registerDispatchRequestData?.(dispatchRequestData);

    return (
      <DataTransportContext.Provider
        value={useMemo(
          () => ({
            useStaticValueRef(value) {
              return useRef(useStaticValue(value));
            },
          }),
          []
        )}
      >
        {children}
      </DataTransportContext.Provider>
    );
  };
