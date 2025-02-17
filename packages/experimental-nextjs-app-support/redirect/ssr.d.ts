export {
  InMemoryCache as NextSSRInMemoryCache,
  ApolloClient as NextSSRApolloClient,
  resetApolloClientSingletons as resetNextSSRApolloSingletons,
  SSRMultipartLink,
  DebounceMultipartResponsesLink,
  RemoveMultipartDirectivesLink,
  ApolloNextAppProvider,
} from "./index.js";

/**
 * @deprecated
 * Importing `useBackgroundQuery` from this package is no longer necessary.
 * Import it directly from `@apollo/client` instead.

 * Please update your import to
 * ```ts
 * import { useBackgroundQuery } from "@apollo/client";
 * ```
 */
declare const useBackgroundQuery: typeof import("@apollo/client/react").useBackgroundQuery;
/**
 * @deprecated
 * Importing `useFragment` from this package is no longer necessary.
 * Import it directly from `@apollo/client` instead.

 * Please update your import to
 * ```ts
 * import { useFragment } from "@apollo/client";
 * ```
 */
declare const useFragment: typeof import("@apollo/client/react").useFragment;
/**
 * @deprecated
 * Importing `useQuery` from this package is no longer necessary.
 * Import it directly from `@apollo/client` instead.

 * Please update your import to
 * ```ts
 * import { useQuery } from "@apollo/client";
 * ```
 */
declare const useQuery: typeof import("@apollo/client/react").useQuery;
/**
 * @deprecated
 * Importing `useReadQuery` from this package is no longer necessary.
 * Import it directly from `@apollo/client` instead.

 * Please update your import to
 * ```ts
 * import { useReadQuery } from "@apollo/client";
 * ```
 */
declare const useReadQuery: typeof import("@apollo/client/react").useReadQuery;
/**
 * @deprecated
 * Importing `useSuspenseQuery` from this package is no longer necessary.
 * Import it directly from `@apollo/client` instead.

 * Please update your import to
 * ```ts
 * import { useSuspenseQuery } from "@apollo/client";
 * ```
 */
declare const useSuspenseQuery: typeof import("@apollo/client/react").useSuspenseQuery;

export {
  useBackgroundQuery,
  useFragment,
  useQuery,
  useReadQuery,
  useSuspenseQuery,
};
