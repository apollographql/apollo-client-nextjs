"use client";
import React from "react";
import { HttpLink, SuspenseCache } from "@apollo/client";
import {
  ApolloNextAppProvider,
  NextSSRInMemoryCache,
  NextSSRApolloClient,
} from "@apollo/experimental-nextjs-app-support/ssr";

import { SchemaLink } from "@apollo/client/link/schema";

import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { setVerbosity } from "ts-invariant";
import { delayLink } from "@/shared/delayLink";
import { schema } from "../graphql/route";

setVerbosity("debug");
loadDevMessages();
loadErrorMessages();

export function ApolloWrapper({ children }: React.PropsWithChildren<{}>) {
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
      uri: "/graphql",
    });

    return new NextSSRApolloClient({
      cache: new NextSSRInMemoryCache(),
      link: delayLink.concat(
        typeof window === "undefined" ? new SchemaLink({ schema }) : httpLink
      ),
    });
  }

  function makeSuspenseCache() {
    return new SuspenseCache();
  }
}
