"use client";
import React from "react";
import { byEnv } from "@apollo/experimental-nextjs-app-support";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  SuspenseCache,
} from "@apollo/client";
import clientCookies from "js-cookie";
import {
  ApolloNextAppProvider,
  NextSSRInMemoryCache,
  SSRMultipartLink,
} from "@apollo/experimental-nextjs-app-support/ssr";

export function ApolloWrapper({
  children,
  delay: delayProp,
}: React.PropsWithChildren<{
  // this will be passed in from a RSC that can read cookies
  // on the client we want to read the cookie instead
  // but in SSR we don't have access to cookies, so
  // we have to use this weird workaround
  delay: number;
}>) {
  return (
    <ApolloNextAppProvider
      makeClient={makeClient}
      makeSuspenseCache={makeSuspenseCache}
    >
      {children}
    </ApolloNextAppProvider>
  );

  function makeClient() {
    const httpLink = new HttpLink({
      uri: "https://main--hack-the-e-commerce.apollographos.net/graphql",
      fetchOptions: { cache: "no-store" },
    });

    const delayLink = new ApolloLink((operation, forward) => {
      const delay = byEnv({
        SSR: () => delayProp,
        Browser: () => clientCookies.get("apollo-x-custom-delay") ?? delayProp,
      });
      operation.setContext(({ headers = {} }) => {
        return {
          headers: {
            ...headers,
            "x-custom-delay": delay,
          },
        };
      });

      return forward(operation);
    });
    const link = byEnv({
      SSR: () =>
        ApolloLink.from([
          new SSRMultipartLink({
            stripDefer: false,
            cutoffDelay: 100,
          }),
          delayLink,
          httpLink,
        ]),
      default: () => ApolloLink.from([delayLink, httpLink]),
    });

    return new ApolloClient({
      cache: new NextSSRInMemoryCache(),
      link,
    });
  }

  function makeSuspenseCache() {
    return new SuspenseCache();
  }
}
