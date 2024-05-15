import type { HookWrappers } from "@apollo/client/react/internal/index.js";
import { useTransportValue } from "./useTransportValue.js";
import type { WatchQueryOptions } from "@apollo/client/index.js";
import { useApolloClient } from "@apollo/client/index.js";
import { getSuspenseCache } from "@apollo/client/react/internal/index.js";
import { canonicalStringify } from "@apollo/client/cache/index.js";
import { use } from "react";
import type { ApolloClient } from "./WrappedApolloClient.js";
import { getQueryManager, wrappers } from "./WrappedApolloClient.js";

export const hookWrappers: HookWrappers = {
  useFragment(orig_useFragment) {
    return wrap(orig_useFragment, ["data", "complete", "missing"]);
  },
  useQuery(orig_useQuery) {
    return wrap<typeof orig_useQuery>(
      process.env.REACT_ENV === "ssr"
        ? (query, options) =>
            orig_useQuery(query, { ...options, fetchPolicy: "cache-only" })
        : orig_useQuery,
      ["data", "loading", "networkStatus", "called"]
    );
  },
  useSuspenseQuery(orig_useSuspenseQuery) {
    return wrap(orig_useSuspenseQuery, ["data", "networkStatus"]);
  },
  useReadQuery(orig_useReadQuery) {
    return wrap(orig_useReadQuery, ["data", "networkStatus"]);
  },
};

function wrap<T extends (...args: any[]) => any>(
  useFn: T,
  transportKeys: (keyof ReturnType<T>)[]
): T {
  return ((...args: any[]) => {
    const result = useFn(...args);
    const transported: Partial<typeof result> = {};
    for (const key of transportKeys) {
      transported[key] = result[key];
    }
    return { ...result, ...useTransportValue(transported) };
  }) as T;
}

export const enableSSRWaitForUseQuery: (client: ApolloClient<any>) => void =
  process.env.REACT_ENV === "ssr"
    ? (client) => {
        getQueryManager(client)[wrappers].useQuery = (orig_useQuery) =>
          wrap<typeof orig_useQuery>(
            function useQuery(query, options) {
              const client = useApolloClient();
              const result = client.cache.read({
                query,
                variables: options?.variables,
                returnPartialData: options?.returnPartialData,
                optimistic: false,
              });
              if (!result) {
                const queryRef = getSuspenseCache(client).getQueryRef(
                  [query, canonicalStringify(options?.variables), "useQuery"],
                  () =>
                    client.watchQuery({
                      query,
                      ...(options as Partial<WatchQueryOptions>),
                    })
                );
                use(queryRef.promise);
              }

              return orig_useQuery(query, {
                ...options,
                fetchPolicy: "cache-only",
              });
            },
            ["data", "loading", "networkStatus", "called"]
          );
      }
    : () => {};
