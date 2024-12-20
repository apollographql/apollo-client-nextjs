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

loadDevMessages();
loadErrorMessages();

export function createRouter() {
  const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    uri: "http://localhost:5173/graphql",
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
