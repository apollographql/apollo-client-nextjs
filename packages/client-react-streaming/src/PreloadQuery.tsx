import type { ReactNode } from "react";
import { SimulatePreloadedQuery } from "./index.cc.js";
import type { ApolloClient, QueryOptions } from "@apollo/client";
import React from "react";

export function PreloadQuery({
  options,
  getClient,
  children,
}: {
  options: QueryOptions;
  getClient: () => ApolloClient<any>;
  children: ReactNode;
}) {
  const resultPromise = getClient().query({
    ...options,
    // TODO: create a second Client instance only for `PreloadQuery` calls
    // We want to prevent "client" data from leaking into our "RSC" cache,
    // as that data should always be strictly separated.
    fetchPolicy: "no-cache",
  });
  return (
    <SimulatePreloadedQuery options={options} result={resultPromise}>
      {children}
    </SimulatePreloadedQuery>
  );
}
