"use client";
import * as React from "react";
import type {
  ApolloClient} from "@apollo/client";
import {
  ApolloProvider as _ApolloProvider,
} from "@apollo/client";
import {
  HydrationContextOptions,
  RehydrationContextProvider,
} from "./RehydrationContext";

export const ApolloClientSingleton = Symbol.for("ApolloClientSingleton");

declare global {
  interface Window {
    [ApolloClientSingleton]?: ApolloClient<any>;
  }
}
export const ApolloNextAppProvider = ({
  makeClient,
  children,
  ...hydrationContextOptions
}: React.PropsWithChildren<
  {
    makeClient: () => ApolloClient<any>;
  } & HydrationContextOptions
>) => {
  const clientRef = React.useRef<ApolloClient<any>>();

  if (typeof window !== "undefined") {
    clientRef.current = window[ApolloClientSingleton] ??= makeClient();
  } else {
    if (!clientRef.current) {
      clientRef.current = makeClient();
    }
  }

  return (
    <_ApolloProvider client={clientRef.current}>
      <RehydrationContextProvider {...hydrationContextOptions}>
        {children}
      </RehydrationContextProvider>
    </_ApolloProvider>
  );
};
