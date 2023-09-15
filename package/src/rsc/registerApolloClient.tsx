import "server-only";

import type { ApolloClient } from "@apollo/client";

export function registerApolloClient(makeClient: () => ApolloClient<any>) {
  const getClient = makeClient;
  return {
    getClient,
  };
}
