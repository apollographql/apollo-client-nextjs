import type { ApolloClient } from "@apollo/client-react-streaming";
import { createTransportedQueryPreloader } from "@apollo/client-react-streaming";
import { ApolloProvider } from "./ApolloProvider.js";
import {
  createQueryPreloader,
  type PreloadQueryFunction,
} from "@apollo/client/index.js";
import { type AnyRouter } from "@tanstack/react-router";
import React from "react";

export interface ApolloClientRouterContext {
  apolloClient: ApolloClient;
  preloadQuery: PreloadQueryFunction;
}

export function routerWithApolloClient<TRouter extends AnyRouter>(
  router: TRouter["options"]["context"] extends ApolloClientRouterContext
    ? TRouter
    : never,
  apolloClient: ApolloClient
): TRouter {
  const context = router.options.context as ApolloClientRouterContext;

  context.apolloClient = apolloClient;
  context.preloadQuery = router.isServer
    ? (createTransportedQueryPreloader(
        apolloClient
      ) as unknown as PreloadQueryFunction)
    : createQueryPreloader(apolloClient);

  const PreviousInnerWrap = router.options.InnerWrap || React.Fragment;
  // eslint-disable-next-line react/display-name
  router.options.InnerWrap = ({ children }) => (
    <ApolloProvider router={router}>
      <PreviousInnerWrap>{children}</PreviousInnerWrap>
    </ApolloProvider>
  );

  return router;
}
