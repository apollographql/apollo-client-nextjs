import type {
  CacheKey,
  QueryReferenceBase,
} from "@apollo/client/react/internal/index.js";
import {
  wrapQueryRef,
  getSuspenseCache,
  unwrapQueryRef,
} from "@apollo/client/react/internal/index.js";

import {
  useApolloClient,
  type ApolloClient,
  type QueryReference,
} from "@apollo/client/index.js";
import {
  deserializeOptions,
  type TransportedOptions,
} from "./DataTransportAbstraction/transportedOptions.js";
import { useEffect } from "react";
import { canonicalStringify } from "@apollo/client/cache/index.js";
import type { RestrictedPreloadOptions } from "./PreloadQuery.js";

export type TransportedQueryRefOptions = TransportedOptions &
  RestrictedPreloadOptions;

export interface TransportedQueryRef<TData = unknown, TVariables = unknown>
  extends QueryReferenceBase<TData, TVariables> {
  __transportedQueryRef: true | QueryReference<any, any>;
  options: TransportedQueryRefOptions;
  queryKey: string;
  toPromise?: () => Promise<TransportedQueryRef>;
}

export function createTransportedQueryRef<TData, TVariables>(
  options: TransportedQueryRefOptions,
  queryKey: string,
  promise: Promise<any>
): TransportedQueryRef<TData, TVariables> {
  const ref: TransportedQueryRef<TData, TVariables> = {
    __transportedQueryRef: true,
    options,
    queryKey,
  };
  Object.defineProperty(ref, "toPromise", {
    value: () => promise.then(() => ref),
    enumerable: false,
  });
  return ref;
}

export function reviveTransportedQueryRef(
  queryRef: TransportedQueryRef,
  client: ApolloClient<any>
): [QueryReference<any, any>, CacheKey] {
  const hydratedOptions = deserializeOptions(queryRef.options);
  const cacheKey: CacheKey = [
    hydratedOptions.query,
    canonicalStringify(hydratedOptions.variables),
    queryRef.queryKey,
  ];
  if (queryRef.__transportedQueryRef === true) {
    queryRef.__transportedQueryRef = wrapQueryRef(
      getSuspenseCache(client).getQueryRef(cacheKey, () =>
        client.watchQuery(hydratedOptions)
      )
    );
  }
  return [queryRef.__transportedQueryRef, cacheKey];
}

function isTransportedQueryRef(
  queryRef: object
): queryRef is TransportedQueryRef {
  return "__transportedQueryRef" in queryRef;
}

export function useWrapTransportedQueryRef<TData, TVariables>(
  queryRef: QueryReference<TData, TVariables> | TransportedQueryRef
) {
  const client = useApolloClient();
  let cacheKey: CacheKey | undefined;
  if (isTransportedQueryRef(queryRef)) {
    [queryRef, cacheKey] = reviveTransportedQueryRef(queryRef, client);
  }
  const unwrapped = unwrapQueryRef<any>(queryRef);
  useEffect(() => {
    if (cacheKey) {
      if (unwrapped.disposed) {
        getSuspenseCache(client).add(cacheKey, unwrapped);
      }
    }
    // Omitting the deps is intentional. This avoids stale closures and the
    // conditional ensures we aren't running the logic on each render.
  });
  return queryRef;
}
