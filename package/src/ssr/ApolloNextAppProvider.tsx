"use client";
import * as React from "react";
import {
  ApolloClient,
  SuspenseCache,
  ApolloProvider as _ApolloProvider,
} from "@apollo/client";
import { RehydrationContextProvider } from "./RehydrationContext";

const ApolloClientSingleton = Symbol.for("ApolloClientSingleton");
const SuspenseCacheSingleton = Symbol.for("ApolloSuspenseCacheSingleton");

declare global {
  interface Window {
    [ApolloClientSingleton]?: ApolloClient<any>;
    [SuspenseCacheSingleton]?: SuspenseCache;
  }
}
export const ApolloNextAppProvider = ({
  makeClient,
  children,
  makeSuspenseCache,
}: React.PropsWithChildren<{
  makeClient: () => ApolloClient<any>;
  makeSuspenseCache?: () => SuspenseCache;
}>) => {
  const clientRef = React.useRef<ApolloClient<any>>();
  const suspenseCacheRef = React.useRef<SuspenseCache>();

  if (typeof window !== "undefined") {
    clientRef.current = window[ApolloClientSingleton] ??= makeClient();
    suspenseCacheRef.current = window[SuspenseCacheSingleton] ??=
      makeSuspenseCache?.();
  } else {
    if (!clientRef.current) {
      clientRef.current = makeClient();
    }
    if (!suspenseCacheRef.current && makeSuspenseCache) {
      suspenseCacheRef.current = makeSuspenseCache();
    }
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
