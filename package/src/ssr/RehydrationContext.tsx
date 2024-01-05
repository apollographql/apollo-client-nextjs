import { useApolloClient } from "@apollo/client";
import React from "react";
import { NextSSRInMemoryCache } from "./NextSSRInMemoryCache";
import { ServerInsertedHTMLContext } from "next/navigation";
import type { RehydrationContextValue } from "./types";
import { registerDataTransport, transportDataToJS } from "./dataTransport";
import invariant from "ts-invariant";
import { NextSSRApolloClient } from "./NextSSRApolloClient";

const ApolloRehydrationContext = React.createContext<
  RehydrationContextValue | undefined
>(undefined);

export interface HydrationContextOptions {
  extraScriptProps?: ScriptProps;
}

type SerializableProps<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends string | number | boolean | undefined | null
      ? K
      : never;
  }[keyof T]
>;

type ScriptProps = SerializableProps<
  React.ScriptHTMLAttributes<HTMLScriptElement>
>;

export const RehydrationContextProvider = ({
  children,
  extraScriptProps,
}: React.PropsWithChildren<HydrationContextOptions>) => {
  const client = useApolloClient();
  const rehydrationContext = React.useRef<RehydrationContextValue>();
  if (typeof window == "undefined") {
    if (!rehydrationContext.current) {
      rehydrationContext.current = buildApolloRehydrationContext({
        extraScriptProps,
      });
    }
    if (client instanceof NextSSRApolloClient) {
      client.setRehydrationContext(rehydrationContext.current);
    } else {
      throw new Error(
        "When using Next SSR, you must use the `NextSSRApolloClient`"
      );
    }
    if (client.cache instanceof NextSSRInMemoryCache) {
      client.cache.setRehydrationContext(rehydrationContext.current);
    } else {
      throw new Error(
        "When using Next SSR, you must use the `NextSSRInMemoryCache`"
      );
    }
  } else {
    registerDataTransport();
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

function buildApolloRehydrationContext({
  extraScriptProps,
}: HydrationContextOptions): RehydrationContextValue {
  const rehydrationContext: RehydrationContextValue = {
    currentlyInjected: false,
    transportValueData: {},
    transportedValues: {},
    incomingResults: [],
    incomingBackgroundQueries: [],
    RehydrateOnClient() {
      rehydrationContext.currentlyInjected = false;
      if (
        !Object.keys(rehydrationContext.transportValueData).length &&
        !Object.keys(rehydrationContext.incomingResults).length &&
        !Object.keys(rehydrationContext.incomingBackgroundQueries).length
      )
        return <></>;
      invariant.debug(
        "transporting data",
        rehydrationContext.transportValueData
      );
      invariant.debug(
        "transporting results",
        rehydrationContext.incomingResults
      );
      invariant.debug(
        "transporting incomingBackgroundQueries",
        rehydrationContext.incomingBackgroundQueries
      );

      const __html = transportDataToJS({
        rehydrate: Object.fromEntries(
          Object.entries(rehydrationContext.transportValueData).filter(
            ([key, value]) =>
              rehydrationContext.transportedValues[key] !== value
          )
        ),
        results: rehydrationContext.incomingResults,
        backgroundQueries: rehydrationContext.incomingBackgroundQueries,
      });
      Object.assign(
        rehydrationContext.transportedValues,
        rehydrationContext.transportValueData
      );
      rehydrationContext.transportValueData = {};
      rehydrationContext.incomingResults = [];
      rehydrationContext.incomingBackgroundQueries = [];
      return (
        <script
          {...extraScriptProps}
          dangerouslySetInnerHTML={{
            __html,
          }}
        />
      );
    },
  };
  return rehydrationContext;
}
