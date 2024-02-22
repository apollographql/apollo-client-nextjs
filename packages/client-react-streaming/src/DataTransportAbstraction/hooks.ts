"use client";
import type { ApolloClient } from "@apollo/client/index.js";
import {
  useApolloClient,
  useFragment,
  useSuspenseQuery,
  useReadQuery,
  useQuery,
  useBackgroundQuery,
} from "@apollo/client/index.js";
import { wrapFunction } from "@apollo/client/utilities/internal/index.js";
import { useTransportValue } from "./useTransportValue.js";
import { WrappedApolloClient } from "./WrappedApolloClient.js";

export {
  useFragment,
  useSuspenseQuery,
  useReadQuery,
  useQuery,
  useBackgroundQuery,
};

wrap(
  useFragment,
  ["data", "complete", "missing"],
  (options) => options?.client
);
wrap<typeof useQuery>(
  process.env.REACT_ENV === "ssr"
    ? (query, options) =>
        useQuery(query, { ...options, fetchPolicy: "cache-only" })
    : useQuery,
  ["data", "loading", "networkStatus", "called"],
  (_, options) => options?.client
);
wrap(useSuspenseQuery, ["data", "networkStatus"], (_, options) =>
  typeof options === "object" ? options.client : undefined
);
wrap(useReadQuery, ["data", "networkStatus"], () => undefined);

function wrap<T extends (...args: any[]) => any>(
  useFn: T,
  transportKeys: (keyof ReturnType<T>)[],
  getClientFromArgs: (...args: Parameters<T>) => ApolloClient<any> | undefined
): T {
  return wrapFunction(
    useFn,
    (useFn) =>
      ((...args: Parameters<T>) => {
        let client;
        try {
          client = useApolloClient(getClientFromArgs(...args));
        } catch {
          /** nothing to do */
        }
        if (client && client instanceof WrappedApolloClient) {
          const result = useFn(...args);
          const transported: Partial<typeof result> = {};
          for (const key of transportKeys) {
            transported[key] = result[key];
          }
          return { ...result, ...useTransportValue(transported) };
        }
        // if this is called with a non-wrapped client (maybe in a test?), just call the original hook
        return useFn(...args);
      }) as T
  );
}
