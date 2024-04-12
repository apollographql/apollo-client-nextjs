"use client";

import type { FetchResult } from "@apollo/client/index.js";
import {
  skipToken,
  useApolloClient,
  useBackgroundQuery,
} from "@apollo/client/index.js";
import type { ApolloClient as WrappedApolloClient } from "./DataTransportAbstraction/WrappedApolloClient.js";
import type { TransportIdentifier } from "./DataTransportAbstraction/DataTransportAbstraction.js";
import {
  deserializeOptions,
  type TransportedOptions,
} from "./DataTransportAbstraction/transportedOptions.js";
import type { QueryManager } from "@apollo/client/core/QueryManager.js";
import { useMemo } from "react";
import type { ReactNode } from "react";
import invariant from "ts-invariant";
import type { TransportedQueryRefOptions } from "./transportedQueryRef.js";
import type { PreloadQueryOptions } from "./PreloadQuery.js";

const handledRequests = new WeakMap<TransportedOptions, TransportIdentifier>();

export function SimulatePreloadedQuery<T>({
  options,
  result,
  children,
  queryKey,
}: {
  options: TransportedQueryRefOptions;
  result: Promise<FetchResult<T>>;
  children: ReactNode;
  queryKey?: string;
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
      (result: FetchResult<any>) => {
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

  const bgQueryArgs = useMemo<Parameters<typeof useBackgroundQuery>>(() => {
    const { query, ...hydratedOptions } = deserializeOptions(
      options
    ) as PreloadQueryOptions<any, T>;
    return [
      query,
      queryKey
        ? {
            ...hydratedOptions,
            queryKey,
          }
        : skipToken,
    ];
  }, [options, queryKey]);

  useBackgroundQuery(...bgQueryArgs);

  return children;
}
