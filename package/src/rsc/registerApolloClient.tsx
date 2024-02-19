import "server-only";

import type { ApolloClient } from "@apollo/client/index.js";
import { cache } from "react";

export function registerApolloClient(makeClient: () => ApolloClient<any>) {
  const getClient = cache(makeClient);
  return {
    getClient,
  };
}
