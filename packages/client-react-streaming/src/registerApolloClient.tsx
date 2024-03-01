import type { ApolloClient } from "@apollo/client/index.js";
import { cache } from "react";

const seenWrappers = WeakSet
  ? new WeakSet<{ client: ApolloClient<any> | Promise<ApolloClient<any>> }>()
  : undefined;
const seenClients = WeakSet
  ? new WeakSet<ApolloClient<any> | Promise<ApolloClient<any>>>()
  : undefined;

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
  // React invalidates the cache on each server request, so the wrapping
  // object is needed to properly detect whether the client is a unique
  // reference or not. We can warn if `cachedMakeWrappedClient` creates a new "wrapper",
  // but with a `client` property that we have already seen before.
  // In that case, not every call to `makeClient` would create a new
  // `ApolloClient` instance.
  function makeWrappedClient() {
    return { client: makeClient() };
  }

  const cachedMakeWrappedClient = cache(makeWrappedClient);

  function getClient() {
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
    const wrapper = cachedMakeWrappedClient();
    if (seenWrappers && seenClients) {
      if (!seenWrappers.has(wrapper)) {
        if (seenClients.has(wrapper.client)) {
          console.warn(
            `
Multiple calls to \`getClient\` for different requests returned the same client instance.
This means that private user data could accidentally be shared between requests.
This for example happens if you create a global \`ApolloClient\` instance and your \`makeClient\`
implementation just looks like \`() => client\`.
Please insure to always call \`new ApolloClient\` **inside** your \`makeClient\` function and to
return a new instance every time \`makeClient\` is called.
`.trim()
          );
        }
        seenWrappers.add(wrapper);
        seenClients.add(wrapper.client);
      }
    }
    return wrapper.client;
  }
  return {
    getClient,
  };
}
