"use client";
import React from "react";
import { useRef } from "react";
import { ApolloClient } from "./WrappedApolloClient.js";
import { ApolloProvider } from "@apollo/client/index.js";
import type { DataTransportProviderImplementation } from "./DataTransportAbstraction.js";
import { ApolloClientSingleton } from "./symbols.js";

declare global {
  interface Window {
    [ApolloClientSingleton]?: ApolloClient<any>;
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
      makeClient: () => ApolloClient<any>;
    } & ExtraProps
  >) => {
    const clientRef = useRef<ApolloClient<any>>();

    if (process.env.REACT_ENV === "ssr") {
      if (!clientRef.current) {
        clientRef.current = makeClient();
      }
    } else {
      clientRef.current = window[ApolloClientSingleton] ??= makeClient();
    }

    if (!(clientRef.current instanceof ApolloClient)) {
      throw new Error(
        "When using Apollo Client streaming SSR, you must use the `ApolloClient` variant provided by the streaming package."
      );
    }

    return (
      <ApolloProvider client={clientRef.current}>
        <TransportProvider
          onQueryEvent={(event) =>
            event.type === "started"
              ? clientRef.current!.onQueryStarted!(event)
              : clientRef.current!.onQueryProgress!(event)
          }
          rerunSimulatedQueries={clientRef.current.rerunSimulatedQueries}
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
