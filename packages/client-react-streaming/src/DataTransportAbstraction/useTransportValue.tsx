"use client";
import { useContext, useSyncExternalStore } from "react";
import { DataTransportContext } from "./DataTransportAbstraction.js";
import { equal } from "@wry/equality";

const CLEAN = {};
const enum WhichResult {
  client,
  server,
}

/**
 * A hook that mostly acts as an identity function.
 * It will only behave differently during
 * the first render on the client, in which case it will
 * try to return the last value it was called with by
 * the same component during SSR. If that is successful,
 * it will schedule another rerender, to after hydration
 * the component can change to client-side values instead.
 */
export function useTransportValue<T>(value: T): T {
  const dataTransport = useContext(DataTransportContext);
  if (!dataTransport)
    throw new Error(
      "useTransportValue must be used within a streaming-specific ApolloProvider"
    );
  const valueRef = dataTransport.useStaticValueRef<T | typeof CLEAN>(value);

  const whichResult = useSyncExternalStore(
    () => () => {},
    () => WhichResult.client,
    () =>
      valueRef.current === CLEAN
        ? WhichResult.client
        : equal(value, valueRef.current)
          ? WhichResult.client
          : WhichResult.server
  );

  if (whichResult === WhichResult.client) {
    // this value will never be used again
    // so we can safely delete it to save memory
    valueRef.current = CLEAN;
  }

  return whichResult === WhichResult.server ? (valueRef.current as T) : value;
}
