import "server-only";

import type { ApolloClient } from "@apollo/client/index.js";
import { cache } from "rehackt";

export function registerApolloClient(makeClient: () => ApolloClient<any>) {
  const getClient = cache(makeClient);
  return {
    getClient,
  };
}
