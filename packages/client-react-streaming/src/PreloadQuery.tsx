import { SimulatePreloadedQuery } from "./index.cc.js";
import type {
  ApolloClient,
  ApolloQueryResult,
  Observable,
  OperationVariables,
  QueryOptions,
} from "@apollo/client";
import type { ReactNode } from "react";
import React from "react";
import { serializeOptions } from "./DataTransportAbstraction/transportedOptions.js";
import type { TransportedQueryRef } from "./transportedQueryRef.js";
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
  getClient,
  children,
  ...options
}: PreloadQueryOptions<TVariables, TData> & {
  getClient: () => ApolloClient<any> | Promise<ApolloClient<any>>;
  children:
    | ReactNode
    | ((
        queryRef: TransportedQueryRef<NoInfer<TData>, NoInfer<TVariables>>
      ) => ReactNode);
}): React.ReactElement {
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

  // const resultPromise = Promise.resolve(getClient())
  //   .then((client) => client.query<TData, TVariables>(preloadOptions))
  //   .then<Array<Omit<ProgressEvent, "id">>, Array<Omit<ProgressEvent, "id">>>(
  //     (result) => [
  //       { type: "data", result: sanitizeForTransport(result) },
  //       { type: "complete" },
  //     ],
  //     () => [{ type: "error" }]
  //   );

  type ObservableEvent<TData> =
    | { type: "error" | "complete" }
    | { type: "data"; result: ApolloQueryResult<TData> };

  async function* observableToAsyncEventIterator<T>(
    observable: Observable<ApolloQueryResult<T>>
  ) {
    let resolveNext: (value: ObservableEvent<T>) => void;
    const promises: Promise<ObservableEvent<T>>[] = [];
    queuePromise();

    function queuePromise() {
      promises.push(
        new Promise<ObservableEvent<T>>((resolve) => {
          resolveNext = (event: ObservableEvent<T>) => {
            resolve(event);
            queuePromise();
          };
        })
      );
    }

    observable.subscribe(
      (value) =>
        resolveNext({ type: "data", result: sanitizeForTransport(value) }),
      () => resolveNext({ type: "error" }),
      () => resolveNext({ type: "complete" })
    );
    yield "initialization value" as unknown as Promise<ObservableEvent<T>>;

    while (true) {
      const val = await promises.shift()!;
      yield val;
    }
  }

  async function* resultAsyncGeneratorFunction(): AsyncGenerator<
    Omit<ProgressEvent, "id">
  > {
    const client = await getClient();

    const obsQuery = client.watchQuery<TData, TVariables>(preloadOptions);

    const asyncEventIterator = observableToAsyncEventIterator(obsQuery);

    for await (const event of asyncEventIterator) {
      yield event;
      const cacheDiff = client.cache.diff({
        query: preloadOptions.query,
        optimistic: false,
        // variables: preloadOptions.variables,
      });
      if (cacheDiff.complete || event.type === "error") {
        return;
      }
    }
  }

  const queryKey = crypto.randomUUID();

  return (
    <SimulatePreloadedQuery<TData>
      options={transportedOptions}
      result={resultAsyncGeneratorFunction()}
      queryKey={typeof children === "function" ? queryKey : undefined}
    >
      {typeof children === "function"
        ? children(
            createTransportedQueryRef<TData, TVariables>(
              transportedOptions,
              queryKey
              // resultAsyncGeneratorFunction
            )
          )
        : children}
    </SimulatePreloadedQuery>
  );
}

function sanitizeForTransport<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}
