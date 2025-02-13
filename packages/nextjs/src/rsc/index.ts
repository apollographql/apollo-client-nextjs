import type { OperationVariables } from "@apollo/client/index.js";
import {
  registerApolloClient as _registerApolloClient,
  type TransportedQueryRef as _TransportedQueryRef,
} from "@apollo/client-integration-nextjs";

/**
 * @deprecated
 * This import has moved to `"@apollo/client-integration-nextjs"`.
 *
 * Please update your import to
 * ```ts
 * import { registerApolloClient } from "@apollo/client-integration-nextjs";
 * ```
 */
export const registerApolloClient = _registerApolloClient;

/**
 * @deprecated
 * This import has moved to `"@apollo/client-integration-nextjs"`.
 *
 * Please update your import to
 * ```ts
 * import type { TransportedQueryRef } from "@apollo/client-integration-nextjs";
 * ```
 */
export type TransportedQueryRef<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
> = _TransportedQueryRef<TData, TVariables>;
