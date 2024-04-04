import type { ReactNode } from "react";
import { SimulatePreloadedQuery } from "./index.cc.js";
import type {
  ApolloClient,
  QueryOptions,
  QueryReference,
} from "@apollo/client";
import React from "react";

export function PreloadQuery({
  options,
  getClient,
  children,
}: {
  options: QueryOptions;
  getClient: () => ApolloClient<any>;
  children: ReactNode | ((queryRef: QueryReference) => ReactNode);
}) {
  const resultPromise = getClient()
    .query({
      ...options,
      // TODO: create a second Client instance only for `PreloadQuery` calls
      // We want to prevent "client" data from leaking into our "RSC" cache,
      // as that data should always be strictly separated.
      fetchPolicy: "no-cache",
    })
    .then((result) => JSON.parse(JSON.stringify(result)));
  // while they would serialize nicely over the boundary, React will
  // confuse the GraphQL `Location` class with the browser `Location` and
  // complain about `Location` objects not being serializable
  const cleanedOptions = JSON.parse(JSON.stringify(options));
  return (
    <SimulatePreloadedQuery options={cleanedOptions} result={resultPromise}>
      {typeof children === "function"
        ? children({
            __transportedQueryRef: true,
            options: cleanedOptions,
          } as any as QueryReference)
        : children}
    </SimulatePreloadedQuery>
  );
}
