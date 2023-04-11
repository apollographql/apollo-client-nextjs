"use client";
import * as React from "react";
import {
  ApolloClient,
  SuspenseCache,
  ApolloProvider as _ApolloProvider,
} from "@apollo/client";
import { RehydrationContextProvider } from "./RehydrationContext";

export const ApolloProvider = ({
  makeClient,
  children,
  makeSuspenseCache,
}: React.PropsWithChildren<{
  makeClient: () => ApolloClient<any>;
  makeSuspenseCache?: () => SuspenseCache;
}>) => {
  const clientRef = React.useRef<ApolloClient<any>>();
  if (!clientRef.current) {
    clientRef.current = makeClient();
  }
  const suspenseCacheRef = React.useRef<SuspenseCache>();
  if (!suspenseCacheRef.current && makeSuspenseCache) {
    suspenseCacheRef.current = makeSuspenseCache();
  }

  return (
    <_ApolloProvider
      client={clientRef.current}
      suspenseCache={suspenseCacheRef.current}
    >
      <RehydrationContextProvider>{children}</RehydrationContextProvider>
    </_ApolloProvider>
  );
};
