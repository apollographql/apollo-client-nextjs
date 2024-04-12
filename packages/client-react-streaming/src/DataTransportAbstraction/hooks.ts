import type { HookWrappers } from "@apollo/client/react/internal/index.js";
import { useTransportValue } from "./useTransportValue.js";
import { useWrapTransportedQueryRef } from "../transportedQueryRef.js";

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
    return wrap(
      (queryRef) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return orig_useReadQuery(useWrapTransportedQueryRef(queryRef));
      },
      ["data", "networkStatus"]
    );
  },
  useQueryRefHandlers(orig_useQueryRefHandlers) {
    return wrap((queryRef) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return orig_useQueryRefHandlers(useWrapTransportedQueryRef(queryRef));
    }, []);
  },
};

function wrap<T extends (...args: any[]) => any>(
  useFn: T,
  transportKeys: (keyof ReturnType<T>)[]
): T {
  return ((...args: any[]) => {
    const result = useFn(...args);
    if (transportKeys.length == 0) {
      return result;
    }
    const transported: Partial<typeof result> = {};
    for (const key of transportKeys) {
      transported[key] = result[key];
    }
    return { ...result, ...useTransportValue(transported) };
  }) as T;
}
