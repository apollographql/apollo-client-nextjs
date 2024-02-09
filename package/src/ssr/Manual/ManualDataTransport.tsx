import React, { useCallback, useEffect, useId, useMemo, useRef } from "rehackt";
import type { DataTransportProviderImplementation } from "@apollo/experimental-nextjs-app-support/core";
import { DataTransportContext } from "@apollo/experimental-nextjs-app-support/core";
import type { Cache, WatchQueryOptions } from "@apollo/client/index.js";
import type { RehydrationCache, RehydrationContextValue } from "./types.js";
import type { HydrationContextOptions } from "./RehydrationContext.js";
import { buildApolloRehydrationContext } from "./RehydrationContext.js";
import { registerDataTransport } from "./dataTransport.js";

interface BuildArgs {
  /**
   * A hook that allows for insertion into the stream.
   * Will only be called during SSR, doesn't need to actiually return something otherwise.
   */
  useInsertHtml(): (callbacks: () => React.ReactNode) => void;
}

const buildManualDataTransportSSRImpl = ({
  useInsertHtml,
}: BuildArgs): DataTransportProviderImplementation<HydrationContextOptions> =>
  function ManualDataTransportSSRImpl({
    extraScriptProps,
    children,
    registerDispatchRequestData,
    registerDispatchRequestStarted,
  }) {
    const insertHtml = useInsertHtml();

    const rehydrationContext = useRef<RehydrationContextValue>();
    if (!rehydrationContext.current) {
      rehydrationContext.current = buildApolloRehydrationContext({
        insertHtml,
        extraScriptProps,
      });
    }

    registerDispatchRequestStarted!((options: WatchQueryOptions) => {
      rehydrationContext.current!.incomingBackgroundQueries.push(options);
    });
    registerDispatchRequestData!((options: Cache.WriteOptions) => {
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
    function ManualDataTransportBrowserImpl({
      children,
      onRequestStarted,
      onRequestData,
      rerunSimulatedQueries,
    }) {
      const hookRehydrationCache = useRef<RehydrationCache>({});

      registerDataTransport({
        onRequestStarted: (options) => {
          // we are not streaming anymore, so we should not simulate "server-side requests"
          if (document.readyState === "complete") return;
          onRequestStarted!(options);
        },
        onRequestData: onRequestData!,
        onRehydrate(rehydrate) {
          Object.assign(hookRehydrationCache.current, rehydrate);
        },
      });

      useEffect(() => {
        if (document.readyState !== "complete") {
          // happens simulatenously to `readyState` changing to `"complete"`, see
          // https://html.spec.whatwg.org/multipage/parsing.html#the-end (step 9.1 and 9.5)
          window.addEventListener("load", rerunSimulatedQueries!, {
            once: true,
          });
          return () =>
            window.removeEventListener("load", rerunSimulatedQueries!);
        }
      }, [rerunSimulatedQueries]);

      const useStaticValueRef = useCallback(function useStaticValueRef<T>(
        v: T
      ) {
        const id = useId();
        const store = hookRehydrationCache.current;
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
