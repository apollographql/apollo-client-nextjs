"use client";
import React from "react";
import { useRef } from "react";
import { ApolloClient } from "./WrappedApolloClient.js";
import { ApolloProvider } from "@apollo/client/index.js";
import type { DataTransportProviderImplementation } from "./DataTransportAbstraction.js";
import { ApolloClientSingleton } from "./symbols.js";
import { bundle } from "../bundleInfo.js";

declare global {
  interface Window {
    [ApolloClientSingleton]?: ApolloClient<any>;
  }
}

/**
 * A version of `ApolloProvider` particularly suited for React's streaming SSR.
 */
export interface WrappedApolloProvider<ExtraProps> {
  ({
    makeClient,
    children,
    ...extraProps
  }: React.PropsWithChildren<
    {
      makeClient: () => ApolloClient<any>;
    } & ExtraProps
  >): React.JSX.Element;
  /**
   * Information about the current package and it's export names, for use in error messages.
   */
  info: {
    pkg: string;
    client: string;
    cache: string;
  };
}

/**
 * Creates an ApolloProvider for streaming SSR.
 *
 * @param TransportProvider - The transport provider to be used.
 * This could e.g. be a `ManualDataTransport` created by `buildManualDataTransport`,
 * or a fully custom implementation of `DataTransportProviderImplementation`.
 * @public
 */
export function WrapApolloProvider<ExtraProps>(
  TransportProvider: DataTransportProviderImplementation<ExtraProps>
): WrappedApolloProvider<ExtraProps> {
  const WrappedApolloProvider: WrappedApolloProvider<ExtraProps> = ({
    makeClient,
    children,
    ...extraProps
  }) => {
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
        `When using \`ApolloClient\` in streaming SSR, you must use the \`${WrappedApolloProvider.info.client}\` export provided by \`"${WrappedApolloProvider.info.pkg}"\`.`
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
  WrappedApolloProvider.info = bundle;
  return WrappedApolloProvider;
}
