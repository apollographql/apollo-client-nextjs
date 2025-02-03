import {
  isTransportedQueryRef,
  reviveTransportedQueryRef,
} from "@apollo/client-react-streaming";
import type { ApolloClient } from "@apollo/client-react-streaming";
import { createTransportedQueryPreloader } from "@apollo/client-react-streaming";
import { ApolloProvider } from "./ApolloProvider.js";
import {
  createQueryPreloader,
  type PreloadQueryFunction,
} from "@apollo/client/index.js";
import { useRouterState, type AnyRouter } from "@tanstack/react-router";
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

  const previousHydrate = router.options.hydrate;
  router.options.hydrate = async (transformed) => {
    console.log("router.option.hydrate - hydrating", transformed);
    if (previousHydrate) previousHydrate(transformed);
    JSON.stringify(transformed, (_, value) => {
      if (isTransportedQueryRef(value)) {
        // Due to the timing in `afterHydrate`, the stream at this point will still be an empty object
        // to be replaced by the `extracted` stream value a moment later
        // Nonetheless, we want to kick off hydration of the queryRef here already,
        // so query deduplication kicks in.
        // So we create an intermediate `TransformStream` that is exposed via a getter,
        // while at the same time, a setter is put into place that will start piping the
        // incoming stream into our intermediate stream as soon as it is set.
        // The check for `instanceof ReadableStream` is here just in case that the timing changes
        // in the future and we don't need to do this anymore.
        const intermediateStream = new TransformStream();
        Object.defineProperty(value.$__apollo_queryRef, "stream", {
          get: () => intermediateStream.readable,
          set: (value: ReadableStream) => {
            value.pipeTo(intermediateStream.writable);
          },
        });
        reviveTransportedQueryRef(value, apolloClient);
      }
      return value;
    });
  };

  const PreviousInnerWrap = router.options.InnerWrap || React.Fragment;
  // eslint-disable-next-line react/display-name
  router.options.InnerWrap = ({ children }) => (
    <ApolloProvider router={router}>
      <PreviousInnerWrap>{children}</PreviousInnerWrap>
    </ApolloProvider>
  );

  return router;
}
