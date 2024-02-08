import React, { useCallback, useId, useMemo, useRef } from "rehackt";
import type { DataTransportProviderImplementation } from "@apollo/experimental-nextjs-app-support/core";
import { DataTransportContext } from "@apollo/experimental-nextjs-app-support/core";
import type { Cache, WatchQueryOptions } from "@apollo/client/index.js";
import type { RehydrationCache, RehydrationContextValue } from "./types.js";
import type { HydrationContextOptions } from "./RehydrationContext.js";
import { buildApolloRehydrationContext } from "./RehydrationContext.js";
import { registerDataTransport } from "./dataTransport.js";

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
    const rehydrationContext = useRef<RehydrationContextValue>();
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
      const id = useId();
      rehydrationContext.current!.transportValueData[id] = value;
      return { current: value };
    }, []);

    return (
      <DataTransportContext.Provider
        value={useMemo(
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
      const rehydrationCache = useRef<RehydrationCache>({});

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
        const id = useId();
        const store = rehydrationCache.current;
        const dataRef = useRef(UNINITIALIZED as T);
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
          value={useMemo(
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
  process.env.REACT_ENV === "ssr"
    ? buildManualDataTransportSSRImpl
    : buildManualDataTransportBrowserImpl;
