import assert from "node:assert";
import { test } from "node:test";
import { outsideOf } from "./util/runInConditions.js";

test("Error message when `WrappedApolloClient` is instantiated with wrong `InMemoryCache`", async () => {
  const { ApolloClient } = await import("#bundled");
  const upstreamPkg = await import("@apollo/client/index.js");
  assert.throws(
    () =>
      new ApolloClient({
        cache: new upstreamPkg.InMemoryCache(),
        connectToDevTools: false,
      }),
    {
      message:
        'When using `InMemoryCache` in streaming SSR, you must use the `InMemoryCache` export provided by `"@apollo/client-react-streaming"`.',
    }
  );
});

test(
  "Error message when using `ManualDataTransport` with the wrong `ApolloClient`",
  { skip: outsideOf("node") },
  async () => {
    const { WrapApolloProvider } = await import("#bundled");
    const upstreamPkg = await import("@apollo/client/index.js");
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");

    const Provider = WrapApolloProvider({} as any);

    assert.throws(
      () =>
        renderToString(
          createElement(Provider, {
            makeClient: () =>
              // @ts-expect-error we want to test exactly this
              new upstreamPkg.ApolloClient({
                cache: new upstreamPkg.InMemoryCache(),
              }),
            children: null,
          })
        ),
      {
        message:
          'When using `ApolloClient` in streaming SSR, you must use the `ApolloClient` export provided by `"@apollo/client-react-streaming"`.',
      }
    );
  }
);

test(
  "Error message when using `ManualDataTransport` with the wrong `ApolloClient`",
  { skip: outsideOf("browser") },
  async () => {
    const { WrapApolloProvider } = await import("#bundled");
    const upstreamPkg = await import("@apollo/client/index.js");
    const React = await import("react");
    const { createRoot } = await import("react-dom/client");

    const jsdom = await import("global-jsdom");
    using _cleanupJSDOM = { [Symbol.dispose]: jsdom.default() };

    const { ErrorBoundary } = await import("react-error-boundary");
    // Even with an error Boundary, React will still log to `console.error` - we avoid the noise here.
    using _restoreConsole = silenceConsoleErrors();

    const Provider = WrapApolloProvider({} as any);

    const promise = new Promise((_resolve, reject) => {
      createRoot(document.body).render(
        <ErrorBoundary onError={reject} fallback={<></>}>
          <Provider
            makeClient={() =>
              // @ts-expect-error we want to test exactly this
              new upstreamPkg.ApolloClient({
                cache: new upstreamPkg.InMemoryCache(),
                connectToDevTools: false,
              })
            }
          >
            {null}
          </Provider>
        </ErrorBoundary>
      );
    });
    await assert.rejects(promise, {
      message:
        'When using `ApolloClient` in streaming SSR, you must use the `ApolloClient` export provided by `"@apollo/client-react-streaming"`.',
    });
  }
);

function silenceConsoleErrors() {
  const { error } = console;
  console.error = () => {};
  return {
    [Symbol.dispose]() {
      console.error = error;
    },
  };
}
