import type { ApolloClient } from "@apollo/client/index.js";
import { cache } from "react";

/**
 * > This export is only available in React Server Components
 *
 * Ensures that you can always access the same instance of ApolloClient
 * during RSC for an ongoing request, while always returning
 * a new instance for different requests.
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
 * Ensures that you can always access the same instance of ApolloClient
 * during RSC for an ongoing request, while always returning
 * a new instance for different requests.
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
  // TODO, with `getClient` prebound
  PreloadQuery?: typeof import("./PreloadQuery.js").PreloadQuery;
};
export function registerApolloClient(
  makeClient: (() => Promise<ApolloClient<any>>) | (() => ApolloClient<any>)
) {
  const getClient = cache(makeClient);
  return {
    getClient,
  };
}
