import React from "react";
import type { RehydrationContextValue } from "./types.js";
import { transportDataToJS } from "./dataTransport.js";
import invariant from "ts-invariant";

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

export function buildApolloRehydrationContext({
  extraScriptProps,
  insertHtml,
}: HydrationContextOptions & {
  insertHtml: (callbacks: () => React.ReactNode) => void;
}): RehydrationContextValue {
  function ensureInserted() {
    if (!rehydrationContext.currentlyInjected) {
      rehydrationContext.currentlyInjected = true;
      insertHtml(() => <rehydrationContext.RehydrateOnClient />);
    }
  }

  const rehydrationContext: RehydrationContextValue = {
    currentlyInjected: false,
    transportValueData: getTransportObject(ensureInserted),
    transportedValues: {},
    incomingResults: getTransportArray(ensureInserted),
    incomingBackgroundQueries: getTransportArray(ensureInserted),
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
      rehydrationContext.transportValueData =
        getTransportObject(ensureInserted);
      rehydrationContext.incomingResults = getTransportArray(ensureInserted);
      rehydrationContext.incomingBackgroundQueries =
        getTransportArray(ensureInserted);
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

function getTransportObject(ensureInserted: () => void) {
  return new Proxy(
    {},
    {
      set(...args) {
        ensureInserted();
        return Reflect.set(...args);
      },
    }
  );
}
function getTransportArray(ensureInserted: () => void) {
  return new Proxy<any[]>([], {
    get(...args) {
      if (args[1] === "push") {
        return (...values: any[]) => {
          ensureInserted();
          return args[0].push(...values);
        };
      }
      return Reflect.get(...args);
    },
  });
}
