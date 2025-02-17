"use client";
import { useContext, useSyncExternalStore } from "react";
import { DataTransportContext } from "./DataTransportAbstraction.js";
import { equal } from "@wry/equality";

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
  const valueRef = dataTransport.useStaticValueRef(value);

  const retVal = useSyncExternalStore(
    () => () => {},
    () => value,
    // if the server value does not differ from the client value, we directly return the
    // client value to avoid a reexecution of the render function when the results of
    // `getSnapshot` and `getServerSnapshot` are referentially compared by React.
    () => (equal(value, valueRef.current) ? value : valueRef.current)
  );

  if (retVal === value) {
    // @ts-expect-error this value will never be used again
    // so we can safely delete it
    valueRef.current = undefined;
  }

  return retVal;
}
