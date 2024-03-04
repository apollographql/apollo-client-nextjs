import React, { useCallback, useEffect, useId, useMemo, useRef } from "react";
import type { DataTransportProviderImplementation } from "@apollo/client-react-streaming";
import { DataTransportContext } from "@apollo/client-react-streaming";
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

    registerDispatchRequestStarted!(({ event, observable }) => {
      rehydrationContext.current!.incomingEvents.push(event);
      observable.subscribe({
        next(event) {
          rehydrationContext.current!.incomingEvents.push(event);
        },
      });
    });

    const contextValue = useMemo(
      () => ({
        useStaticValueRef: function useStaticValueRef<T>(value: T) {
          const id = useId();
          rehydrationContext.current!.transportValueData[id] = value;
          return { current: value };
        },
      }),
      []
    );

    return (
      <DataTransportContext.Provider value={contextValue}>
        {children}
      </DataTransportContext.Provider>
    );
  };

const buildManualDataTransportBrowserImpl =
  (): DataTransportProviderImplementation<HydrationContextOptions> =>
    function ManualDataTransportBrowserImpl({
      children,
      onQueryEvent,
      rerunSimulatedQueries,
    }) {
      const hookRehydrationCache = useRef<RehydrationCache>({});
      registerDataTransport({
        onQueryEvent: onQueryEvent!,
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
        } else {
          rerunSimulatedQueries!();
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
