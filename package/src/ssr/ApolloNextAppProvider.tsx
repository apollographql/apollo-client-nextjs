"use client";
import * as React from "react";
import {
  ApolloClient,
  ApolloProvider as _ApolloProvider,
} from "@apollo/client";
import { RehydrationContextProvider } from "./RehydrationContext";

export const ApolloClientSingleton = Symbol.for("ApolloClientSingleton");

declare global {
  interface Window {
    [ApolloClientSingleton]?: ApolloClient<any>;
  }
}
export const ApolloNextAppProvider = ({
  makeClient,
  clientIndex,
  children,
}: React.PropsWithChildren<{
  makeClient: () => ApolloClient<any>;
  clientIndex: string
}>) => {
  const clientRef = React.useRef<ApolloClient<any>>();
  const indexRef = React.useRef<string>(clientIndex);
  
  console.log("clientIndex", indexRef.current, "hi", clientIndex);
  
  if (typeof window !== "undefined") {
    clientRef.current = window[ApolloClientSingleton] ??= makeClient();
  } else {
    if (!clientRef.current || indexRef.current !== clientIndex) {
      clientRef.current = makeClient();
      indexRef.current = clientIndex;
    }
  }


  return (
    <_ApolloProvider client={clientRef.current}>
      <RehydrationContextProvider>{children}</RehydrationContextProvider>
    </_ApolloProvider>
  );
};
