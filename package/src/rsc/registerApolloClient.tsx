import "server-only";

import type { ApolloClient } from "@apollo/client";
import * as React from "react";

export function registerApolloClient<T extends any[]>(makeClient: (...args: T) => ApolloClient<any>) {
  const getClient = React.cache(makeClient);
  return {
    getClient,
  };
}
