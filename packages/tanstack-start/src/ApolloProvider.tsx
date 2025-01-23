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
      for (const key of router.streamedKeys) {
        if (key.startsWith(APOLLO_EVENT_PREFIX)) {
          const streamedValue = router.getStreamedValue(key);
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

    if (router.isServer) {
      props.registerDispatchRequestStarted!(({ event, observable }) => {
        const id = crypto.randomUUID() as typeof event.id;
        event.id = id;
        router.streamValue(
          `${APOLLO_EVENT_PREFIX}${event.id}/${event.type}`,
          event satisfies QueryEvent
        );
        observable.subscribe({
          next(event) {
            event.id = id;
            router.streamValue(
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
        if (!key.startsWith(APOLLO_EVENT_PREFIX)) return;
        const streamedValue = router.getStreamedValue(key);
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
            !router.isServer && router.streamedKeys.has(key)
              ? (router.getStreamedValue(key) as T)
              : value;
          const dataRef = useRef(dataValue);

          if (router.isServer) {
            if (!router.streamedKeys.has(key)) {
              router.streamValue(key, value);
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
