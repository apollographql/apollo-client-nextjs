"use client";

import {
  skipToken,
  useApolloClient,
  useBackgroundQuery,
} from "@apollo/client/index.js";
import type { ApolloClient as WrappedApolloClient } from "./DataTransportAbstraction/WrappedApolloClient.js";
import type {
  ProgressEvent,
  TransportIdentifier,
} from "./DataTransportAbstraction/DataTransportAbstraction.js";
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
  result: Promise<Array<Omit<ProgressEvent, "id">>>;
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

    result.then((results) => {
      invariant.debug("Preloaded query %s: received events: %o", id, results);
      for (const event of results) {
        client.onQueryProgress!({ ...event, id } as ProgressEvent);
      }
    });
  }

  const bgQueryArgs = useMemo<Parameters<typeof useBackgroundQuery>>(() => {
    const { query, ...hydratedOptions } = deserializeOptions(
      options
    ) as PreloadQueryOptions<any, T>;
    return [
      query,
      // If we didn't pass in a `queryKey` prop, the user didn't use the render props form and we don't
      // need to create a real `queryRef` => skip.
      // Otherwise we call `useBackgroundQuery` with options in this component to create a `queryRef`
      // and have it soft-retained in the SuspenseCache.
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
