import { SimulatePreloadedQuery } from "./index.cc.js";
import type {
  ApolloClient,
  OperationVariables,
  QueryOptions,
} from "@apollo/client";
import type { ReactNode } from "react";
import React from "react";
import { serializeOptions } from "./DataTransportAbstraction/transportedOptions.js";
import type { TransportedQueryReference } from "./transportedQueryRef.js";
import { createTransportedQueryRef } from "./transportedQueryRef.js";
import type { ProgressEvent } from "./DataTransportAbstraction/DataTransportAbstraction.js";

export type RestrictedPreloadOptions = {
  fetchPolicy?: "cache-first";
  returnPartialData?: false;
  nextFetchPolicy?: undefined;
  pollInterval?: undefined;
};

export type PreloadQueryOptions<TVariables, TData> = QueryOptions<
  TVariables,
  TData
> &
  RestrictedPreloadOptions;

export function PreloadQuery<TData, TVariables extends OperationVariables>({
  options,
  getClient,
  children,
}: {
  options: PreloadQueryOptions<TVariables, TData>;
  getClient: () => ApolloClient<any> | Promise<ApolloClient<any>>;
  children:
    | ReactNode
    | ((
        queryRef: TransportedQueryReference<NoInfer<TData>, NoInfer<TVariables>>
      ) => ReactNode);
}) {
  const preloadOptions = {
    ...options,
    fetchPolicy: "cache-first" as const,
    returnPartialData: false,
    pollInterval: undefined,
    nextFetchPolicy: undefined,
  } satisfies RestrictedPreloadOptions;

  const transportedOptions = sanitizeForTransport(
    serializeOptions(preloadOptions)
  );

  const resultPromise = Promise.resolve(getClient())
    .then((client) => client.query<TData, TVariables>(preloadOptions))
    .then<Array<Omit<ProgressEvent, "id">>, Array<Omit<ProgressEvent, "id">>>(
      (result) => [
        { type: "data", result: sanitizeForTransport(result) },
        { type: "complete" },
      ],
      () => [{ type: "error" }]
    );

  const queryKey = crypto.randomUUID();

  return (
    <SimulatePreloadedQuery<TData>
      options={transportedOptions}
      result={resultPromise}
      queryKey={typeof children === "function" ? queryKey : undefined}
    >
      {typeof children === "function"
        ? children(
            createTransportedQueryRef<TData, TVariables>(
              transportedOptions,
              queryKey,
              resultPromise
            )
          )
        : children}
    </SimulatePreloadedQuery>
  );
}

function sanitizeForTransport<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}
