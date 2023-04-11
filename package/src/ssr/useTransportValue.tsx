"use client";
import { useEffect, useId, useState } from "react";
import { ApolloRehydrationCache } from "./ApolloRehydrateSymbols";
import { useRehydrationContext } from "./RehydrationContext";

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
  const id = useId();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const rehydrationContext = useRehydrationContext();
  if (typeof window == "undefined") {
    if (rehydrationContext) {
      rehydrationContext.transportValueData[id] = value;
    }
  } else {
    const store = window[ApolloRehydrationCache];
    if (store) {
      if (isClient) {
        delete store[id];
      }
      if (id in store) value = store[id] as T;
    }
  }
  return value;
}
