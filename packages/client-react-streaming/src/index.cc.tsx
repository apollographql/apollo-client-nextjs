"use client";

import type { ProgressEvent } from "./DataTransportAbstraction/DataTransportAbstraction.js";
import type { ReactNode } from "react";
import type { TransportedQueryRefOptions } from "./transportedQueryRef.js";
import * as React from "react";

let RealSimulatePreloadedQuery: typeof SimulatePreloadedQuery;
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
}): ReactNode {
  if (!RealSimulatePreloadedQuery) {
    RealSimulatePreloadedQuery = React.lazy(() =>
      import("./SimulatePreloadedQuery.cc.js").then((m) => ({
        default: m.SimulatePreloadedQuery,
      }))
    );
  }
  return (
    <RealSimulatePreloadedQuery
      options={options}
      result={result}
      queryKey={queryKey}
    >
      {children}
    </RealSimulatePreloadedQuery>
  );
}
