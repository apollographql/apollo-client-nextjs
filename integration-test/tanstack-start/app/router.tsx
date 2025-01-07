import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import {
  routerWithApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-tanstack-start";

import {
  loadErrorMessages,
  loadDevMessages,
} from "@apollo/client/dev/index.js";

import { IncrementalSchemaLink } from "@integration-test/shared/IncrementalSchemaLink";
import { schema } from "@integration-test/shared/schema";
import { HttpLink, ApolloLink } from "@apollo/client/index.js";

loadDevMessages();
loadErrorMessages();

const link =
  typeof window === "undefined"
    ? (new IncrementalSchemaLink({ schema }) as any as ApolloLink)
    : new HttpLink({ uri: "/api/graphql" });

export function createRouter() {
  const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    link,
  });
  const router = createTanStackRouter({
    routeTree,
    context: {} as any,
  });

  // @ts-ignore need to investigate
  return routerWithApolloClient(router, apolloClient);
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
