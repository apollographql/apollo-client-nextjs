"use client";

import * as React from "react";

let RealSimulatePreloadedQuery: typeof import("./SimulatePreloadedQuery.cc.js").default;
export const SimulatePreloadedQuery: typeof import("./SimulatePreloadedQuery.cc.js").default =
  (props) => {
    if (!RealSimulatePreloadedQuery) {
      RealSimulatePreloadedQuery = React.lazy(
        () => import("./SimulatePreloadedQuery.cc.js")
      );
    }
    return <RealSimulatePreloadedQuery {...props} />;
  };
