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

/**
 * A `TransportedQueryReference` is an opaque object accessible via renderProp within `PreloadQuery`.
 *
 * A child client component reading the `TransportedQueryReference` via useReadQuery will suspend until the promise resolves.
 */
export interface TransportedQueryReference<
  TData = unknown,
  TVariables = unknown,
> extends QueryReferenceBase<TData, TVariables> {
  /**
   * Only available in React Server Components.
   * Will be `undefined` after being passed to Client Components.
   *
   * Returns a promise that resolves back to the `TransportedQueryReference` that can be awaited in RSC to suspend a subtree until the originating query has been loaded.
   */
  toPromise?: () => Promise<TransportedQueryReference>;
}

export interface InternalTransportedQueryRef<
  TData = unknown,
  TVariables = unknown,
> extends TransportedQueryReference<TData, TVariables> {
  __transportedQueryRef: true | QueryReference<any, any>;
  options: TransportedQueryRefOptions;
  queryKey: string;
}

export function createTransportedQueryRef<TData, TVariables>(
  options: TransportedQueryRefOptions,
  queryKey: string,
  promise: Promise<any>
): InternalTransportedQueryRef<TData, TVariables> {
  const ref: InternalTransportedQueryRef<TData, TVariables> = {
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
  queryRef: InternalTransportedQueryRef,
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
): queryRef is InternalTransportedQueryRef {
  return "__transportedQueryRef" in queryRef;
}

export function useWrapTransportedQueryRef<TData, TVariables>(
  queryRef: QueryReference<TData, TVariables> | InternalTransportedQueryRef
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
