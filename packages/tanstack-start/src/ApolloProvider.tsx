import {
  DataTransportContext,
  WrapApolloProvider,
} from "@apollo/client-react-streaming";
import type { AnyRouter } from "@tanstack/react-router";
import React, { useCallback, useEffect, useId, useMemo, useRef } from "react";
import type { ApolloClient, QueryEvent } from "@apollo/client-react-streaming";
import { bundle } from "./bundleInfo.js";

const APOLLO_EVENT_PREFIX = "@@apollo.event/";
const APOLLO_HOOK_PREFIX = "@@apollo.hook/";

const handledEvents = new WeakSet<object>();

export const ApolloProvider = ({
  router,
  children,
}: React.PropsWithChildren<{ router: AnyRouter }>) => {
  return (
    <WrappedApolloProvider
      router={router}
      makeClient={() =>
        (router.options.context as { apolloClient: ApolloClient }).apolloClient
      }
    >
      {children}
    </WrappedApolloProvider>
  );
};

const WrappedApolloProvider = WrapApolloProvider<{ router: AnyRouter }>(
  (props) => {
    const router = props.router;

    const { onQueryEvent } = props;
    const consumeBackPressure = useCallback(() => {
      if (!router.clientSsr) return;
      for (const key of router.clientSsr.streamedKeys) {
        if (key.startsWith(APOLLO_EVENT_PREFIX)) {
          const streamedValue = router.clientSsr.getStreamedValue(key);
          if (
            streamedValue &&
            typeof streamedValue === "object" &&
            !handledEvents.has(streamedValue) &&
            onQueryEvent
          ) {
            handledEvents.add(streamedValue);
            onQueryEvent(streamedValue as QueryEvent);
          }
        }
      }
    }, [router, onQueryEvent]);

    if (router.serverSsr) {
      const ssr = router.serverSsr;
      props.registerDispatchRequestStarted!(({ event, observable }) => {
        const id = crypto.randomUUID() as typeof event.id;
        event.id = id;
        ssr.streamValue(
          `${APOLLO_EVENT_PREFIX}${event.id}/${event.type}`,
          event satisfies QueryEvent
        );
        observable.subscribe({
          next(event) {
            event.id = id;
            ssr.streamValue(
              `${APOLLO_EVENT_PREFIX}${event.id}/${event.type}`,
              event satisfies QueryEvent
            );
          },
        });
      });
    } else {
      // this needs to happen synchronously before the render continues
      // so "loading" is kicked off before the respecitve component is rendered
      consumeBackPressure();
    }

    useEffect(() => {
      consumeBackPressure();
      return router.subscribe("onStreamedValue", ({ key }) => {
        if (!router.clientSsr) return;
        if (!key.startsWith(APOLLO_EVENT_PREFIX)) return;
        const streamedValue = router.clientSsr.getStreamedValue(key);
        if (streamedValue && onQueryEvent) {
          handledEvents.add(streamedValue);
          onQueryEvent(streamedValue as QueryEvent);
        }
      });
    }, [consumeBackPressure, router, onQueryEvent]);

    const dataTransport = useMemo(
      () => ({
        useStaticValueRef<T>(value: T) {
          const key = APOLLO_HOOK_PREFIX + useId();
          const dataValue =
            router.clientSsr && router.clientSsr.streamedKeys.has(key)
              ? (router.clientSsr.getStreamedValue(key) as T)
              : value;
          const dataRef = useRef(dataValue);

          if (router.serverSsr) {
            if (!router.serverSsr.streamedKeys.has(key)) {
              router.serverSsr.streamValue(key, value);
            }
          }
          return dataRef;
        },
      }),
      [router]
    );

    return (
      <DataTransportContext.Provider value={dataTransport}>
        {props.children}
      </DataTransportContext.Provider>
    );
  }
);
WrappedApolloProvider.info = bundle;
