import React, { useCallback } from "react";
import type { DataTransportProviderImplementation } from "../DataTransportAbstraction";
import { DataTransportContext } from "../DataTransportAbstraction";
import type { Cache, WatchQueryOptions } from "@apollo/client";
import type { RehydrationCache, RehydrationContextValue } from "./types";
import type { HydrationContextOptions } from "./RehydrationContext";
import { buildApolloRehydrationContext } from "./RehydrationContext";
import { registerDataTransport } from "./dataTransport";

interface BuildArgs {
  useInsertHtml(): ((callbacks: () => React.ReactNode) => void) | null;
}

const buildManualDataTransportSSRImpl = ({
  useInsertHtml,
}: BuildArgs): DataTransportProviderImplementation<HydrationContextOptions> =>
  function NextDataTransportSSRImpl({
    extraScriptProps,
    children,
    registerDispatchRequestData: dispatchRequestData,
    registerDispatchRequestStarted: dispatchRequestStarted,
  }) {
    const insertHtml = useInsertHtml();
    if (!insertHtml) {
      throw new Error("No data transport available!");
    }
    const rehydrationContext = React.useRef<RehydrationContextValue>();
    if (!rehydrationContext.current) {
      rehydrationContext.current = buildApolloRehydrationContext({
        insertHtml,
        extraScriptProps,
      });
    }

    dispatchRequestStarted!((options: WatchQueryOptions) => {
      rehydrationContext.current!.incomingBackgroundQueries.push(options);
    });
    dispatchRequestData!((options: Cache.WriteOptions) => {
      rehydrationContext.current!.incomingResults.push(options);
    });

    const useStaticValueRef = useCallback(function useStaticValueRef<T>(
      value: T
    ) {
      const id = React.useId();
      rehydrationContext.current!.transportValueData[id] = value;
      return { current: value };
    }, []);

    return (
      <DataTransportContext.Provider
        value={React.useMemo(
          () => ({
            useStaticValueRef,
          }),
          [useStaticValueRef]
        )}
      >
        {children}
      </DataTransportContext.Provider>
    );
  };

const buildManualDataTransportBrowserImpl =
  (): DataTransportProviderImplementation<HydrationContextOptions> =>
    function NextDataTransportBrowserImpl({
      children,
      onRequestStarted,
      onRequestData,
    }) {
      const rehydrationCache = React.useRef<RehydrationCache>({});

      registerDataTransport({
        onRequestStarted: onRequestStarted!,
        onRequestData: onRequestData!,
        onRehydrate(rehydrate) {
          Object.assign(rehydrationCache.current, rehydrate);
        },
      });

      const useStaticValueRef = useCallback(function useStaticValueRef<T>(
        v: T
      ) {
        const id = React.useId();
        const store = rehydrationCache.current;
        const dataRef = React.useRef(UNINITIALIZED as T);
        if (dataRef.current === UNINITIALIZED) {
          if (store && id in store) {
            dataRef.current = store[id] as T;
            delete store[id];
          } else {
            dataRef.current = v;
          }
        }
        return dataRef;
      }, []);

      return (
        <DataTransportContext.Provider
          value={React.useMemo(
            () => ({
              useStaticValueRef,
            }),
            [useStaticValueRef]
          )}
        >
          {children}
        </DataTransportContext.Provider>
      );
    };

const UNINITIALIZED = {};

export const buildManualDataTransport: (
  args: BuildArgs
) => DataTransportProviderImplementation<HydrationContextOptions> =
  typeof window === "undefined"
    ? buildManualDataTransportSSRImpl
    : buildManualDataTransportBrowserImpl;
