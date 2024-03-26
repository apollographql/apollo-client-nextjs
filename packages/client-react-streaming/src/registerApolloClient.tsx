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
};
export function registerApolloClient(
  makeClient: (() => Promise<ApolloClient<any>>) | (() => ApolloClient<any>)
) {
  function wrappedMakeClient() {
    if (arguments.length) {
      throw new Error(
        `
You cannot pass arguments into \`getClient\`.
Passing arguments to \`getClient\` returns a different instance
of Apollo Client each time it is called with different arguments, potentially 
resulting in duplicate requests and a non-functional cache. 
      `.trim()
      );
    }
    return makeClient();
  }
  const getClient = cache(wrappedMakeClient);
  return {
    getClient,
  };
}
