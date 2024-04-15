import { SimulatePreloadedQuery } from "./index.cc.js";
import type {
  ApolloClient,
  OperationVariables,
  QueryOptions,
  QueryReference,
  FetchPolicy,
} from "@apollo/client";
import type { ReactNode } from "react";
import React, { useId } from "react";
import { serializeOptions } from "./DataTransportAbstraction/transportedOptions.js";
import { createTransportedQueryRef } from "./transportedQueryRef.js";

export type RestrictedPreloadOptions = {
  fetchPolicy?: "cache-first";
  returnPartialData?: false;
  nextFetchPolicy?: FetchPolicy | undefined;
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
        queryRef: QueryReference<NoInfer<TData>, NoInfer<TVariables>>
      ) => ReactNode);
}) {
  const preloadOptions = {
    ...options,
    fetchPolicy: "cache-first" as const,
    returnPartialData: false,
    pollInterval: undefined,
  } satisfies RestrictedPreloadOptions;

  const transportedOptions = sanitizeForTransport(
    serializeOptions(preloadOptions)
  );

  const resultPromise = Promise.resolve(getClient())
    .then((client) => client.query<TData, TVariables>(preloadOptions))
    .then(sanitizeForTransport);

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

function sanitizeForTransport<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}
