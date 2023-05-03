import type { ApolloClient } from "@apollo/client";
import * as React from "react";

function assertRSC(
  reactImport: typeof import("react")
): asserts reactImport is typeof import("react") & { cache<T>(x: () => T): T } {
  if ("createContext" in React) {
    throw new Error(
      "`registerApolloClient` should only be used in a React Server Component context - in Client Components, use the `ApolloNextAppProvider`!"
    );
  }
}

export function registerApolloClient(makeClient: () => ApolloClient<any>) {
  assertRSC(React);
  const getClient = React.cache(makeClient);
  return {
    getClient,
  };
}
