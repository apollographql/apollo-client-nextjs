import type {
  HookWrappers,
  QueryReference,
} from "@apollo/client/react/internal/index.js";
import { useTransportValue } from "./useTransportValue.js";
import type { QueryOptions } from "@apollo/client";
import {
  getApolloContext,
  createQueryPreloader,
} from "@apollo/client/index.js";
import { use } from "react";

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
        if (isTransportedQueryRef(queryRef)) {
          if (queryRef.__transportedQueryRef === true) {
            const preloader = createQueryPreloader(
              use(getApolloContext()).client!
            );
            const { query, ...options } = queryRef.options;
            // TODO: discuss what to do with the fetchPolicy here
            options.fetchPolicy = "cache-first";
            queryRef.__transportedQueryRef = preloader(
              query,
              options as typeof options & { fetchPolicy: "cache-first" }
            );
          }
          queryRef = queryRef.__transportedQueryRef;
        }
        return orig_useReadQuery(queryRef);
      },
      ["data", "networkStatus"]
    );
  },
};

function isTransportedQueryRef(
  queryRef: object
): queryRef is TransportedQueryRef {
  return "__transportedQueryRef" in queryRef;
}

type TransportedQueryRef = {
  __transportedQueryRef: true | QueryReference<any, any>;
  options: QueryOptions;
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
