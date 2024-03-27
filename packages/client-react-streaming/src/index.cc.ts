"use client";

import type { FetchResult, WatchQueryOptions } from "@apollo/client/index.js";
import { useApolloClient } from "@apollo/client/index.js";
import type { ApolloClient as WrappedApolloClient } from "./DataTransportAbstraction/WrappedApolloClient.js";
import type { TransportIdentifier } from "./DataTransportAbstraction/DataTransportAbstraction.js";
import type { QueryManager } from "@apollo/client/core/QueryManager.js";
import type { ReactNode } from "react";

const handledRequests = new WeakMap<WatchQueryOptions, TransportIdentifier>();

export function SimulatePreloadedQuery({
  options,
  result,
  children,
}: {
  options: WatchQueryOptions;
  result: Promise<FetchResult>;
  children: ReactNode;
}) {
  const client = useApolloClient() as WrappedApolloClient<any>;
  if (!handledRequests.has(options)) {
    const id =
      `preloadedQuery:${(client["queryManager"] as QueryManager<any>).generateQueryId()}` as TransportIdentifier;
    handledRequests.set(options, id);
    client.onQueryStarted!({
      type: "started",
      id,
      options,
    });
    result.then(
      (result) => {
        client.onQueryProgress!({
          type: "data",
          id,
          result,
        });
        client.onQueryProgress!({
          type: "complete",
          id,
        });
      },
      () => {
        // TODO:
        // This will restart the query in SSR **and** in the browser.
        // Currently there is no way of transporting the result received in SSR to the browser.
        // Layers over layers...
        // Maybe instead we should just "fail" the simulated request on the SSR level
        // and only have it re-attempt in the browser?
        client.onQueryProgress!({
          type: "error",
          id,
        });
      }
    );
  }
  return children;
}
