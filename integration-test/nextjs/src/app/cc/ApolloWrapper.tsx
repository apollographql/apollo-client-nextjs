"use client";
import React from "react";
import { ApolloLink, HttpLink, Observable } from "@apollo/client";
import {
  ApolloNextAppProvider,
  NextSSRInMemoryCache,
  NextSSRApolloClient,
} from "@apollo/experimental-nextjs-app-support/ssr";

import { SchemaLink } from "@apollo/client/link/schema";

import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { setVerbosity } from "ts-invariant";
import { delayLink } from "@/shared/delayLink";
import { schema } from "../graphql/schema";

import { useSSROnlySecret } from "ssr-only-secrets";
import { GraphQLError } from "graphql";

setVerbosity("debug");
loadDevMessages();
loadErrorMessages();

const errorLink = new ApolloLink((operation, forward) => {
  const context = operation.getContext();
  if (
    context.error === "always" ||
    (typeof window === "undefined" && context.error === "ssr") ||
    (typeof window !== "undefined" && context.error === "browser")
  ) {
    return new Observable((subscriber) => {
      subscriber.next({
        data: null,
        errors: [new GraphQLError("Simulated error")],
      });
    });
  }
  return forward(operation);
});

export function ApolloWrapper({
  children,
  nonce,
}: React.PropsWithChildren<{ nonce?: string }>) {
  const actualNonce = useSSROnlySecret(nonce, "SECRET");
  return (
    <ApolloNextAppProvider
      makeClient={makeClient}
      extraScriptProps={{
        nonce: actualNonce,
      }}
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
      link: delayLink
        .concat(errorLink)
        .concat(
          typeof window === "undefined" ? new SchemaLink({ schema }) : httpLink
        ),
    });
  }
}
