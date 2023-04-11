import { ApolloCache, useApolloClient } from "@apollo/client";
import {
  ApolloRehydrationCache,
  ApolloResultCache,
} from "./ApolloRehydrateSymbols";
import React from "react";
import { NextSSRInMemoryCache } from "./NextSSRInMemoryCache";
import { ServerInsertedHTMLContext } from "next/navigation";
import { RehydrationContextValue } from "./types";

const ApolloRehydrationContext = React.createContext<
  RehydrationContextValue | undefined
>(undefined);

export const RehydrationContextProvider = ({
  children,
}: React.PropsWithChildren) => {
  const { cache } = useApolloClient();
  const rehydrationContext = React.useRef<RehydrationContextValue>();
  if (typeof window == "undefined") {
    if (!rehydrationContext.current)
      rehydrationContext.current = buildApolloRehydrationContext();

    if (cache instanceof NextSSRInMemoryCache) {
      if (rehydrationContext)
        cache.setRehydrationContext(rehydrationContext.current);
    } else {
      throw new Error(
        "When using Next SSR, you must use the `NextSSRInMemoryCache`"
      );
    }
  }
  return (
    <ApolloRehydrationContext.Provider value={rehydrationContext.current}>
      {children}
    </ApolloRehydrationContext.Provider>
  );
};

export function useRehydrationContext(): RehydrationContextValue | undefined {
  const rehydrationContext = React.useContext(ApolloRehydrationContext);
  const insertHtml = React.useContext(ServerInsertedHTMLContext);

  // help transpilers to omit this code in bundling
  if (typeof window !== "undefined") return;

  if (
    insertHtml &&
    rehydrationContext &&
    !rehydrationContext.currentlyInjected
  ) {
    rehydrationContext.currentlyInjected = true;
    insertHtml(() => <rehydrationContext.RehydrateOnClient />);
  }
  return rehydrationContext;
}

function buildApolloRehydrationContext(): RehydrationContextValue {
  const rehydrationContext: RehydrationContextValue = {
    currentlyInjected: false,
    transportValueData: {},
    transportedValues: {},
    incomingResults: [],
    RehydrateOnClient() {
      rehydrationContext.currentlyInjected = false;
      if (
        !Object.keys(rehydrationContext.transportValueData).length &&
        !Object.keys(rehydrationContext.incomingResults).length
      )
        return <></>;
      console.log("transporting data", rehydrationContext.transportValueData);
      console.log("transporting results", rehydrationContext.incomingResults);

      const ApolloRehydrationCacheKey = Symbol.keyFor(ApolloRehydrationCache),
        ApolloResultCacheKey = Symbol.keyFor(ApolloResultCache);

      const __html = `{
          let v = window[Symbol.for("${ApolloRehydrationCacheKey}")] ??= {}, 
              m = ${JSON.stringify(rehydrationContext.transportValueData)},
              r = window[Symbol.for("${ApolloResultCacheKey}")] ??= [],
              n = ${JSON.stringify(rehydrationContext.incomingResults)};
          Object.assign(v,m);
          r.push(...n);
          console.log(performance.now() + "ms new data from SSR: ",m)
        }`;
      Object.assign(
        rehydrationContext.transportedValues,
        rehydrationContext.transportValueData
      );
      rehydrationContext.transportValueData = {};
      rehydrationContext.incomingResults = [];
      return (
        <script
          dangerouslySetInnerHTML={{
            __html,
          }}
        />
      );
    },
  };
  return rehydrationContext;
}
