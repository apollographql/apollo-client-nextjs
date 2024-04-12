import type { ReactNode } from "react";
import { SimulatePreloadedQuery } from "./index.cc.js";
import type {
  ApolloClient,
  OperationVariables,
  QueryOptions,
  QueryReference,
} from "@apollo/client";
import React, { useId } from "react";
import { serializeOptions } from "./DataTransportAbstraction/transportedOptions.js";
import type { TransportedQueryRefOptions } from "./transportedQueryRef.js";
import { createTransportedQueryRef } from "./transportedQueryRef.js";

export type RestrictedPreloadOptions = {
  fetchPolicy?: "cache-first";
  returnPartialData?: false;
  // TODO: what else goes in here?
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
  getClient: () => ApolloClient<any>;
  children:
    | ReactNode
    | ((
        queryRef: QueryReference<NoInfer<TData>, NoInfer<TVariables>>
      ) => ReactNode);
}) {
  // TODO: create `queryKey` uniquely for this component
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
  const queryKey = useId();
  return (
    <SimulatePreloadedQuery<TData>
      options={transportedOptions}
      result={resultPromise}
      queryKey={typeof children === "function" ? queryKey : undefined}
    >
      {typeof children === "function"
        ? children(
            createTransportedQueryRef(
              transportedOptions,
              queryKey
              // we're lying to TypeScript and our users here.
              // it's okay, they'll never know
            ) as unknown as QueryReference<any, any>
          )
        : children}
    </SimulatePreloadedQuery>
  );
}

function preparePreloadedQueryOptions(
  options: Parameters<typeof PreloadQuery>[0]["options"]
): TransportedQueryRefOptions {
  const transportedOptions = {
    ...serializeOptions(options),
    fetchPolicy: "cache-first" as const,
    returnPartialData: false,
  } satisfies RestrictedPreloadOptions;
  return sanitizeForTransport(transportedOptions);
}

function sanitizeForTransport<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}
