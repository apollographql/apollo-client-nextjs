/**
 * implementation to be used with the experimental React hooks implemented in
 * https://github.com/facebook/react/compare/main...phryneas:react:stream-injection
 *
 * published under https://www.npmjs.com/package/@phryneas/experimental-react
 */

import {
  WrapApolloProvider,
  DataTransportContext,
} from "@apollo/client-react-streaming";
import type {
  DataTransportProviderImplementation,
  QueryEvent,
} from "@apollo/client-react-streaming";
import { useMemo, useActionChannel, useStaticValue, useRef } from "react";
import { invariant } from "ts-invariant";

declare module "react" {
  const useActionChannel: <T>(
    onData: (data: T) => void
  ) => (data: T | Promise<T>) => void;
  /**
   * This api design lends itself to a memory leak - the value passed in here
   * can never be removed from memory.
   * Maybe going with a ref-like object as a return value is a better choice
   * here.
   */
  const useStaticValue: <T>(data: T) => T;
}

export const ExperimentalReactDataTransport: DataTransportProviderImplementation =
  ({ onQueryEvent, registerDispatchRequestStarted, children }) => {
    const dispatchQueryEvent = useActionChannel<QueryEvent>((event) => {
      invariant.debug("received event", event);
      onQueryEvent?.(event);
    });
    registerDispatchRequestStarted?.(({ event, observable }) => {
      let resolve: undefined | ((event: QueryEvent) => void);
      invariant.debug("sending start event", event);
      dispatchQueryEvent(event);
      dispatchQueryEvent(new Promise<QueryEvent>((r) => (resolve = r)));
      observable.subscribe({
        next(event) {
          if (event.type === "data") {
            invariant.debug("sending event", event);
            dispatchQueryEvent(event);
          } else {
            invariant.debug("resolving event promise", event);
            resolve!(event);
          }
        },
      });
    });

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

export const WrappedApolloProvider = WrapApolloProvider(
  ExperimentalReactDataTransport
);
