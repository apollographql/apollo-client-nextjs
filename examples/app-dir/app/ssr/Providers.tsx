"use client";

import { ApolloClient, SuspenseCache } from "@apollo/client";
import {
  ApolloProvider,
  NextSSRInMemoryCache,
} from "@apollo/experimental-next/dist/ssr";

function makeClient() {
  return new ApolloClient({
    uri: "http://localhost:3000/api/graphql",
    cache: new NextSSRInMemoryCache(),
  });
}

function makeSuspenseCache() {
  return new SuspenseCache();
}

export function Providers({ children }: React.PropsWithChildren) {
  return (
    <ApolloProvider
      makeClient={makeClient}
      makeSuspenseCache={makeSuspenseCache}
    >
      {children}
    </ApolloProvider>
  );
}
