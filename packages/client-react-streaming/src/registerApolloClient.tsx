import type { ApolloClient } from "@apollo/client/index.js";
import { cache } from "react";

export function registerApolloClient(
  makeClient: () => Promise<ApolloClient<any>>
): { getClient: () => Promise<ApolloClient<any>> };
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
You cannot pass arguments into \`getClient\`!
If you were to pass arguments into \`getClient\`, you would get a different copy
of Apollo Client for every time you called it with different arguments, resulting
in duplicate requests and a non-functional cache.
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
