import type { CacheKey } from "@apollo/client/react/internal/index.js";
import {
  wrapQueryRef,
  getSuspenseCache,
  unwrapQueryRef,
  assertWrappedQueryRef,
} from "@apollo/client/react/internal/index.js";

import {
  useApolloClient,
  type ApolloClient,
  type QueryRef,
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
 * A `TransportedQueryRef` is an opaque object accessible via renderProp within `PreloadQuery`.
 *
 * A child client component reading the `TransportedQueryRef` via useReadQuery will suspend until the promise resolves.
 *
 * @public
 */
export interface TransportedQueryRef<TData = unknown, TVariables = unknown>
  extends QueryRef<TData, TVariables> {
  /**
   * Temporarily disabled - see https://github.com/apollographql/apollo-client-nextjs/issues/332
   *
   * Will now be be `undefined` both in React Server Components and Client Components until we can find a better resolution.
   */
  toPromise?: undefined;
}

export interface InternalTransportedQueryRef<
  TData = unknown,
  TVariables = unknown,
> extends TransportedQueryRef<TData, TVariables> {
  __transportedQueryRef: true | QueryRef<any, any>;
  options: TransportedQueryRefOptions;
  queryKey: string;
}

export function createTransportedQueryRef<TData, TVariables>(
  options: TransportedQueryRefOptions,
  queryKey: string,
  _promise: Promise<any>
): InternalTransportedQueryRef<TData, TVariables> {
  const ref: InternalTransportedQueryRef<TData, TVariables> = {
    __transportedQueryRef: true,
    options,
    queryKey,
  };
  /*
  Temporarily disabled - see https://github.com/apollographql/apollo-client-nextjs/issues/332
  This causes a dev-mode warning:
      Warning: Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
      <... queryRef={{__transportedQueryRef: true, options: ..., queryKey: ...}}>
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  */
  // Object.defineProperty(ref, "toPromise", {
  //   value: () => promise.then(() => ref),
  //   enumerable: false,
  // });
  return ref;
}

export function reviveTransportedQueryRef(
  queryRef: InternalTransportedQueryRef,
  client: ApolloClient<any>
): [QueryRef<any, any>, CacheKey] {
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
  queryRef: QueryRef<TData, TVariables> | InternalTransportedQueryRef
): QueryRef<TData, TVariables> {
  const client = useApolloClient();
  let cacheKey: CacheKey | undefined;
  let isTransported: boolean;
  if ((isTransported = isTransportedQueryRef(queryRef))) {
    [queryRef, cacheKey] = reviveTransportedQueryRef(queryRef, client);
  }
  assertWrappedQueryRef(queryRef);
  const unwrapped = unwrapQueryRef<any>(queryRef);

  useEffect(() => {
    // We only want this to execute if the queryRef is a transported query.
    if (!isTransported) return;
    // We want to always keep this queryRef in the suspense cache in case another component has another instance of this transported queryRef.
    // This effect could be removed after https://github.com/facebook/react/pull/28996 has been merged and we've updated deps to that version.
    if (cacheKey) {
      if (unwrapped.disposed) {
        getSuspenseCache(client).add(cacheKey, unwrapped);
      }
    }
    // Omitting the deps is intentional. This avoids stale closures and the
    // conditional ensures we aren't running the logic on each render.
  });
  // Soft-retaining because useQueryRefHandlers doesn't do it for us.
  // This effect could be removed after https://github.com/facebook/react/pull/28996 has been merged and we've updated deps to that version.
  useEffect(() => {
    if (isTransported) {
      return unwrapped.softRetain();
    }
  }, [isTransported, unwrapped]);
  return queryRef;
}
