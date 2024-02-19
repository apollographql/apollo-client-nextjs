"use client";
import { useContext, useEffect, useState } from "react";
import { DataTransportContext } from "./DataTransportAbstraction.js";

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
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const dataTransport = useContext(DataTransportContext);
  if (!dataTransport)
    throw new Error(
      "useTransportValue must be used within a streaming-specific ApolloProvider"
    );
  const valueRef = dataTransport.useStaticValueRef(value);
  if (isClient) {
    // @ts-expect-error this value will never be used again
    // so we can safely delete it
    valueRef.current = undefined;
  }

  return isClient ? value : valueRef.current;
}
