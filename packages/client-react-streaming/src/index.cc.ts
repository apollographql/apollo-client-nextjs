"use client";

import type { FetchResult, WatchQueryOptions } from "@apollo/client/index.js";
import { useApolloClient } from "@apollo/client/index.js";
import type { ApolloClient as WrappedApolloClient } from "./DataTransportAbstraction/WrappedApolloClient.js";
import type { TransportIdentifier } from "./DataTransportAbstraction/DataTransportAbstraction.js";
import type { QueryManager } from "@apollo/client/core/QueryManager.js";
import type { ReactNode } from "react";
import invariant from "ts-invariant";

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
    invariant.debug(
      "Preloaded query %s started on the server, simulating ongoing request",
      id
    );
    client.onQueryStarted!({
      type: "started",
      id,
      options,
    });

    result.then(
      (result) => {
        invariant.debug(
          "Preloaded query %s finished on the server, simulating result",
          id
        );
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
        client.onQueryProgress!({
          type: "error",
          id,
        });
      }
    );
  }
  return children;
}
