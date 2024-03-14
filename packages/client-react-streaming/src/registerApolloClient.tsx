import type { ApolloClient } from "@apollo/client/index.js";
import { cache } from "react";

/**
 * > This export is only available in React Server Components
 *
 * Ensures that during RSC for an ongoing request, you can always
 * access the same instance of ApolloClient, while always returning
 * a new instance of different requests.
 *
 * @example
 * ```ts
 * export const { getClient } = registerApolloClient(() => {
 *   return new ApolloClient({
 *     cache: new InMemoryCache(),
 *     link: new HttpLink({
 *       uri: "http://example.com/api/graphql",
 *     }),
 *   });
 * });
 * ```
 *
 * @public
 */
export function registerApolloClient(
  makeClient: () => Promise<ApolloClient<any>>
): { getClient: () => Promise<ApolloClient<any>> };
/**
 * Ensures that during RSC for an ongoing request, you can always
 * access the same instance of ApolloClient, while always returning
 * a new instance of different requests.
 *
 * @example
 * ```ts
 * export const { getClient } = registerApolloClient(() => {
 *   return new ApolloClient({
 *     cache: new InMemoryCache(),
 *     link: new HttpLink({
 *       uri: "http://example.com/api/graphql",
 *     }),
 *   });
 * });
 * ```
 *
 * @public
 */
export function registerApolloClient(makeClient: () => ApolloClient<any>): {
  getClient: () => ApolloClient<any>;
};
export function registerApolloClient(
  makeClient: (() => Promise<ApolloClient<any>>) | (() => ApolloClient<any>)
) {
  const getClient = cache(makeClient);
  return {
    getClient,
  };
}
