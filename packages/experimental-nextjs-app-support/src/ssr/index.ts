import {
  InMemoryCache,
  ApolloClient,
  resetApolloClientSingletons,
  SSRMultipartLink as _SSRMultipartLink,
  DebounceMultipartResponsesLink as _DebounceMultipartResponsesLink,
  RemoveMultipartDirectivesLink as _RemoveMultipartDirectivesLink,
  ApolloNextAppProvider as _ApolloNextAppProvider,
  type TransportedQueryRef as _TransportedQueryRef,
} from "@apollo/experimental-nextjs-app-support";
import {
  useBackgroundQuery as _useBackgroundQuery,
  useFragment as _useFragment,
  useQuery as _useQuery,
  useReadQuery as _useReadQuery,
  useSuspenseQuery as _useSuspenseQuery,
} from "@apollo/client/react/index.js";

/**
 * @deprecated
 * This import has been renamed to `InMemoryCache` and moved to `"@apollo/experimental-nextjs-app-support"`.
 *
 * Please update your import to
 * ```ts
 * import { InMemoryCache } from "@apollo/experimental-nextjs-app-support";
 * ```
 */
export const NextSSRInMemoryCache = InMemoryCache;
/**
 * @deprecated
 * This import has been renamed to `ApolloClient` and moved to `"@apollo/experimental-nextjs-app-support"`.
 *
 * Please update your import to
 * ```ts
 * import { ApolloClient } from "@apollo/experimental-nextjs-app-support";
 * ```
 */
export const NextSSRApolloClient = ApolloClient;
/**
 * @deprecated
 * This import has been renamed to `resetApolloClientSingletons` and moved to `"@apollo/experimental-nextjs-app-support"`.
 *
 * Please update your import to
 * ```ts
 * import { resetApolloClientSingletons } from "@apollo/experimental-nextjs-app-support";
 * ```
 */
export const resetNextSSRApolloSingletons = resetApolloClientSingletons;
/**
 * @deprecated
 * This import has moved to `"@apollo/experimental-nextjs-app-support"`.
 *
 * Please update your import to
 * ```ts
 * import { SSRMultipartLink } from "@apollo/experimental-nextjs-app-support";
 * ```
 */
export const SSRMultipartLink = _SSRMultipartLink;
/**
 * @deprecated
 * This import has moved to `"@apollo/experimental-nextjs-app-support"`.
 *
 * Please update your import to
 * ```ts
 * import { DebounceMultipartResponsesLink } from "@apollo/experimental-nextjs-app-support";
 * ```
 */
export const DebounceMultipartResponsesLink = _DebounceMultipartResponsesLink;
/**
 * @deprecated
 * This import has moved to `"@apollo/experimental-nextjs-app-support"`.
 *
 * Please update your import to
 * ```ts
 * import { RemoveMultipartDirectivesLink } from "@apollo/experimental-nextjs-app-support";
 * ```
 */
export const RemoveMultipartDirectivesLink = _RemoveMultipartDirectivesLink;
/**
 * @deprecated
 * This import has moved to `"@apollo/experimental-nextjs-app-support"`.
 *
 * Please update your import to
 * ```ts
 * import { ApolloNextAppProvider } from "@apollo/experimental-nextjs-app-support";
 * ```
 */
export const ApolloNextAppProvider = _ApolloNextAppProvider;
/**
 * @deprecated
 * This import has moved to `"@apollo/experimental-nextjs-app-support"`.
 *
 * Please update your import to
 * ```ts
 * import type { TransportedQueryRef } from "@apollo/experimental-nextjs-app-support";
 * ```
 */
export type TransportedQueryRef<
  TData = unknown,
  TVariables = unknown,
> = _TransportedQueryRef<TData, TVariables>;
/**
 * @deprecated
 * Importing `useBackgroundQuery` from this package is no longer necessary.  
 * Import it directly from `@apollo/client` instead.  

 * Please update your import to
 * ```ts
 * import { useBackgroundQuery } from "@apollo/client";
 * ```
 */
export const useBackgroundQuery = _useBackgroundQuery;
/**
 * @deprecated
 * Importing `useFragment` from this package is no longer necessary.  
 * Import it directly from `@apollo/client` instead.  

 * Please update your import to
 * ```ts
 * import { useFragment } from "@apollo/client";
 * ```
 */
export const useFragment = _useFragment;
/**
 * @deprecated
 * Importing `useQuery` from this package is no longer necessary.  
 * Import it directly from `@apollo/client` instead.  

 * Please update your import to
 * ```ts
 * import { useQuery } from "@apollo/client";
 * ```
 */
export const useQuery = _useQuery;
/**
 * @deprecated
 * Importing `useReadQuery` from this package is no longer necessary.  
 * Import it directly from `@apollo/client` instead.  

 * Please update your import to
 * ```ts
 * import { useReadQuery } from "@apollo/client";
 * ```
 */
export const useReadQuery = _useReadQuery;
/**
 * @deprecated
 * Importing `useSuspenseQuery` from this package is no longer necessary.  
 * Import it directly from `@apollo/client` instead.  

 * Please update your import to
 * ```ts
 * import { useSuspenseQuery } from "@apollo/client";
 * ```
 */
export const useSuspenseQuery = _useSuspenseQuery;
