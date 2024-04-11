import type { ReactNode } from "react";
import { SimulatePreloadedQuery } from "./index.cc.js";
import type {
  ApolloClient,
  FetchResult,
  OperationVariables,
  QueryOptions,
  QueryReference,
} from "@apollo/client";
import React from "react";
import { printMinified } from "./DataTransportAbstraction/printMinified.js";
import type { TransportedOptions } from "./DataTransportAbstraction/DataTransportAbstraction.js";

export function PreloadQuery<TData, TVariables extends OperationVariables>({
  options,
  getClient,
  children,
}: {
  options: QueryOptions<TVariables, TData>;
  getClient: () => ApolloClient<any>;
  children:
    | ReactNode
    | ((
        queryRef: QueryReference<NoInfer<TData>, NoInfer<TVariables>>
      ) => ReactNode);
}) {
  const resultPromise = getClient()
    .query<TData, TVariables>({
      ...options,
      // TODO: create a second Client instance only for `PreloadQuery` calls
      // We want to prevent "client" data from leaking into our "RSC" cache,
      // as that data should always be strictly separated.
      fetchPolicy: "no-cache",
    })
    .then(sanitizeForTransport);
  const transportedOptions = preparePreloadedQueryOptions(options);
  return (
    <SimulatePreloadedQuery<TData>
      options={transportedOptions}
      result={resultPromise}
    >
      {typeof children === "function"
        ? children({
            __transportedQueryRef: true,
            options: transportedOptions,
          } as any as QueryReference<TData, TVariables>)
        : children}
    </SimulatePreloadedQuery>
  );
}

function preparePreloadedQueryOptions(
  options: Parameters<typeof PreloadQuery>[0]["options"]
): TransportedOptions {
  const transportedOptions = {
    ...options,
    query: printMinified(options.query),
  };
  return sanitizeForTransport(transportedOptions);
}

function sanitizeForTransport<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}
