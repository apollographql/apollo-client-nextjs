"use client";

import { ApolloClient, HttpLink, SuspenseCache } from "@apollo/client";
import {
  ApolloProvider,
  NextSSRInMemoryCache,
} from "@apollo/experimental-next/dist/ssr";

function makeClient() {
  return new ApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: new HttpLink({
      uri: "http://localhost:3000/api/graphql",
      fetchOptions: { cache: "no-store" },
    }),
  });
}

function makeSuspenseCache() {
  return new SuspenseCache();
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloProvider
      makeClient={makeClient}
      makeSuspenseCache={makeSuspenseCache}
    >
      {children}
    </ApolloProvider>
  );
}
