import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Link, Outlet } from "@tanstack/react-router";
import { Meta, Scripts } from "@tanstack/start";
import type { ReactNode } from "react";

import { type ApolloClientRouterContext } from "@apollo/client-integration-tanstack-start";
import { createRootRouteWithContext } from "@tanstack/react-router";

export const Route = createRootRouteWithContext<ApolloClientRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <Meta />
      </head>
      <body>
        <div className="p-2 flex gap-2 text-lg">
          <Link
            to="/"
            activeProps={{
              className: "font-bold",
            }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>{" "}
          <Link
            to="/loader-defer"
            activeProps={{
              className: "font-bold",
            }}
          >
            Loader with @defer + useReadQuery
          </Link>{" "}
          <Link
            to="/useSuspenseQuery"
            activeProps={{
              className: "font-bold",
            }}
          >
            useSuspenseQuery
          </Link>{" "}
        </div>
        <hr />
        {children}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}
