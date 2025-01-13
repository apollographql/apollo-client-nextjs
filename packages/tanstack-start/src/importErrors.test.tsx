import * as assert from "node:assert";
import { test } from "node:test";
import { outsideOf } from "@internal/test-utils/runInConditions.js";
import { browserEnv } from "@internal/test-utils/react.js";

test("Error message when `WrappedApolloClient` is instantiated with wrong `InMemoryCache`", async () => {
  const { ApolloClient } = await import("#bundled");
  const upstreamPkg = await import("@apollo/client/index.js");
  assert.throws(
    () =>
      new ApolloClient({
        // @ts-expect-error this is what we're testing
        cache: new upstreamPkg.InMemoryCache(),
        connectToDevTools: false,
      }),
    {
      message:
        'When using `InMemoryCache` in streaming SSR, you must use the `InMemoryCache` export provided by `"@apollo/client-integration-tanstack-start"`.',
    }
  );
});

test(
  "Error message when using the wrong `ApolloClient`",
  { skip: outsideOf("node") },
  async () => {
    const { routerWithApolloClient, ...bundled } = await import("#bundled");
    const tsr = await import("@tanstack/react-router");
    const tss = await import("@tanstack/start/server");
    const React = await import("react");
    const routeTree = tsr
      .createRootRouteWithContext<
        import("@apollo/client-integration-tanstack-start").ApolloClientRouterContext
      >()({
        component: () => <></>,
      })
      .addChildren({});

    await test("@apollo/client should error", async () => {
      const { ApolloClient, InMemoryCache } = await import(
        "@apollo/client/index.js"
      );
      using env = await browserEnv();
      const router = routerWithApolloClient(
        tsr.createRouter({
          routeTree,
          context: {} as any,
        }),
        // @ts-expect-error deliberately using the wrong class here
        new ApolloClient({
          cache: new InMemoryCache(),
          uri: "/api/graphql",
        })
      );

      assert.throws(
        () =>
          env.render(document.body, <tss.StartServer router={router as any} />),
        {
          message:
            'When using `ApolloClient` in streaming SSR, you must use the `ApolloClient` export provided by `"@apollo/client-integration-tanstack-start"`.',
        }
      );
    });

    await test("this package should work", async () => {
      const { ApolloClient, InMemoryCache } = bundled;
      using env = await browserEnv();
      const router = routerWithApolloClient(
        tsr.createRouter({
          routeTree,
          context: {} as any,
        }),
        new ApolloClient({
          cache: new InMemoryCache(),
          uri: "/api/graphql",
        })
      );
      env.render(document.body, <tss.StartServer router={router as any} />);
    });
  }
);
