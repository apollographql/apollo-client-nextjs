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
import { HttpLink, ApolloLink, Observable } from "@apollo/client/index.js";

loadDevMessages();
loadErrorMessages();

export const delayLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    const timeout = setTimeout(() => {
      forward(operation).subscribe(observer);
    }, operation.getContext().delay ?? 500);
    return () => clearTimeout(timeout);
  });
});

const link = delayLink.concat(
  typeof window === "undefined"
    ? (new IncrementalSchemaLink({ schema }) as any as ApolloLink)
    : new HttpLink({ uri: "/api/graphql" })
);

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
