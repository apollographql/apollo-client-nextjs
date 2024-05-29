import {
  registerApolloClient as _registerApolloClient,
  type TransportedQueryRef as _TransportedQueryRef,
} from "@apollo/experimental-nextjs-app-support";

/**
 * @deprecated
 * This import has moved to `"@apollo/experimental-nextjs-app-support"`.
 *
 * Please update your import to
 * ```ts
 * import { registerApolloClient } from "@apollo/experimental-nextjs-app-support";
 * ```
 */
export const registerApolloClient = _registerApolloClient;

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
