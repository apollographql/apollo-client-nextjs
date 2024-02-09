"use client";
import React from "rehackt";
import { useRef } from "rehackt";
import { WrappedApolloClient } from "./WrappedApolloClient.js";
import { ApolloProvider } from "@apollo/client/index.js";
import type { DataTransportProviderImplementation } from "./DataTransportAbstraction.js";
import { ApolloClientSingleton } from "./symbols.js";

declare global {
  interface Window {
    [ApolloClientSingleton]?: WrappedApolloClient<any>;
  }
}

/**
 * Creates an ApolloProvider for streaming SSR.
 * @param TransportProvider The transport provider to be used.
 */
export function WrapApolloProvider<ExtraProps>(
  TransportProvider: DataTransportProviderImplementation<ExtraProps>
) {
  const WrappedApolloProvider = ({
    makeClient,
    children,
    ...extraProps
  }: React.PropsWithChildren<
    {
      makeClient: () => WrappedApolloClient<any>;
    } & ExtraProps
  >) => {
    const clientRef = useRef<WrappedApolloClient<any>>();

    if (process.env.REACT_ENV === "ssr") {
      if (!clientRef.current) {
        clientRef.current = makeClient();
      }
    } else {
      clientRef.current = window[ApolloClientSingleton] ??= makeClient();
    }

    if (!(clientRef.current instanceof WrappedApolloClient)) {
      throw new Error(
        "When using Apollo Client streaming SSR, you must use the `ApolloClient` variant provided by the streaming package."
      );
    }

    return (
      <ApolloProvider client={clientRef.current}>
        <TransportProvider
          onRequestStarted={clientRef.current.onRequestStarted}
          onRequestData={clientRef.current.onRequestData}
          rerunSimulatedQueries={clientRef.current.rerunSimulatedQueries}
          registerDispatchRequestData={
            clientRef.current.cache.writeQueue?.register
          }
          registerDispatchRequestStarted={
            clientRef.current.watchQueryQueue?.register
          }
          {...(extraProps as ExtraProps)}
        >
          {children}
        </TransportProvider>
      </ApolloProvider>
    );
  };

  return WrappedApolloProvider;
}
