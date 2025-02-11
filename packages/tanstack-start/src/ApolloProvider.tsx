import {
  DataTransportContext,
  WrapApolloProvider,
} from "@apollo/client-react-streaming";
import { registerLateInitializingQueue } from "@apollo/client-react-streaming/manual-transport";
import type { AnyRouter } from "@tanstack/react-router";
import React, { useId, useMemo, useRef } from "react";
import type { ApolloClient, QueryEvent } from "@apollo/client-react-streaming";
import { bundle } from "./bundleInfo.js";
import jsesc from "jsesc";

const APOLLO_HOOK_PREFIX = "@@apollo.hook/";

declare global {
  interface Window {
    __APOLLO_EVENTS__?: Pick<QueryEvent[], "push">;
  }
}

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

    if (router.serverSsr) {
      const ssr = router.serverSsr;
      props.registerDispatchRequestStarted!(({ event, observable }) => {
        // based on TanStack Router's `injectObservable` implementation:
        // https://github.com/TanStack/router/blob/1ecab1e78d58db208f3bbffe8708867603c179a5/packages/start-server/src/ssr-server.ts#L234-L280
        // Inject a promise that resolves when the stream is done
        // We do this to keep the stream open until we're done
        ssr.injectHtml(
          () =>
            new Promise<string>((resolve) => {
              ensureInitialized(router);
              function transportEvent(event: QueryEvent) {
                const script = `__APOLLO_EVENTS__.push(${jsesc(event, {
                  isScriptContext: true,
                  wrap: true,
                  json: true,
                })})`;
                ssr.injectScript(() => script);
              }

              // transport initial event
              transportEvent(event);
              observable.subscribe({
                next(event) {
                  // transport subsequent events
                  transportEvent(event);
                },
                complete() {
                  resolve("");
                },
                error() {
                  resolve("");
                },
              });
            })
        );
      });
    } else {
      if (onQueryEvent) {
        registerLateInitializingQueue("__APOLLO_EVENTS__", onQueryEvent);
      }
    }

    const dataTransport = useMemo(
      () => ({
        useStaticValueRef<T>(value: T) {
          const key = APOLLO_HOOK_PREFIX + useId();
          const streamedValue = router.clientSsr?.getStreamedValue(key) as
            | T
            | undefined;
          const dataValue =
            router.clientSsr && streamedValue !== undefined
              ? streamedValue
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

const streamedInit = new WeakSet<AnyRouter>();
function ensureInitialized(router: AnyRouter) {
  const ssr = router.serverSsr;
  if (ssr && !streamedInit.has(router)) {
    streamedInit.add(router);
    ssr.injectScript(() => `window.__APOLLO_EVENTS__||=[]`);
  }
}
