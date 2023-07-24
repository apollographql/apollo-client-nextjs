<div align="center">
<img src="https://raw.githubusercontent.com/apollographql/apollo-client-nextjs/main/banner.jpg" width="500" alt="Apollo Client + Next.js App Router" />
</div>

# Apollo Client support for the Next.js App Router

> ❗️ This package is experimental. 
> Generally it should work well, you might run into race conditions when your Client Component is still rendering in SSR, and already making overlapping queries on the browser.  
> This cannot be addressed from our side, but would need API changes in Next.js or React itself.  
> If you do not use suspense in your application, this will not be a problem to you.  

> ❗️ This package depends on Apollo Client 3.8, which is currently an rc release.

## Detailed technical breakdown

You can find a detailed technical breakdown of what this package does and why it needs to do so [in the discussion around the accompanying RFC](https://github.com/apollographql/apollo-client-nextjs/pull/9).

## Why do you need this?

### React Server Components

If you want to use Apollo Client in your Next.js app with React Server Components, you will need a way of creating a client instance that is shared between all your server components for one request to prevent making duplicate requests.

### React Client Components

When using the `app` directory, all your "client components" will not only run in the browser. They will also be rendered on the server - in an "SSR" run that will execute after React Server Components have been rendered.

If you want to make the most of your application, you probably already want to make your GraphQL requests on the server so that the page is fully rendered when it reaches the browser.

This package provides the tools necessary to execute your GraphQL queries on the server and to use the results to hydrate your browser-side cache and components.

## Installation

This package has a peer dependency on the latest rc of `@apollo/client`, so you can install both this package and that Apollo Client version via

```sh
npm install @apollo/client@rc @apollo/experimental-nextjs-app-support
```

## Usage

> ❗️ **We do handle "RSC" and "SSR" use cases as completely separate.**  
> You should generally try not to have overlapping queries between the two, as all queries made in SSR can dynamically update in the browser as the cache updates (e.g. from a mutation or another query), but queries made in RSC will not be updated in the browser - for that purpose, the full page would need to rerender. As a result, any overlapping data would result in inconsistencies in your UI.  
> So decide for yourself, which queries you want to make in RSC and which in SSR, and don't have them overlap.

### In RSC

Create an `ApolloClient.js` file:

```js
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc";

export const { getClient } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      // this needs to be an absolute url, as relative urls cannot be used in SSR
      uri: "http://example.com/api/graphql",
      // you can disable result caching here if you want to
      // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
      // fetchOptions: { cache: "no-store" },
    }),
  });
});
```

You can then use that `getClient` function in your server components:

```js
const { data } = await getClient().query({ query: userQuery });
```

### In SSR

If you use the `app` directory, each Client Component _will_ be SSR-rendered for the initial request. So you will need to use this package.

First, create a new file `app/ApolloWrapper.jsx`:

```js
"use client";
// ^ this file needs the "use client" pragma

import { ApolloLink, HttpLink } from "@apollo/client";
import {
  ApolloNextAppProvider,
  NextSSRInMemoryCache,
  NextSSRApolloClient,
  SSRMultipartLink,
} from "@apollo/experimental-nextjs-app-support/ssr";

// have a function to create a client for you
function makeClient() {
  const httpLink = new HttpLink({
    // this needs to be an absolute url, as relative urls cannot be used in SSR
    uri: "https://example.com/api/graphql",
    // you can disable result caching here if you want to
    // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
    fetchOptions: { cache: "no-store" },
  });

  return new NextSSRApolloClient({
    // use the `NextSSRInMemoryCache`, not the normal `InMemoryCache`
    cache: new NextSSRInMemoryCache(),
    link:
      typeof window === "undefined"
        ? ApolloLink.from([
            // in a SSR environment, if you use multipart features like
            // @defer, you need to decide how to handle these.
            // This strips all interfaces with a `@defer` directive from your queries.
            new SSRMultipartLink({
              stripDefer: true,
            }),
            httpLink,
          ])
        : httpLink,
  });
}

// you need to create a component to wrap your app in
export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
```

Now you can wrap your `RootLayout` in this wrapper component:

```js
import { ApolloWrapper } from "./ApolloWrapper";

// ...

export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
```

> ☝️ This will work even if your layout is a React Server Component and will also allow the children of the layout to be React Server Components.  
> It just makes sure that all Client Components will have access to the same Apollo Client instance, shared through the `ApolloNextAppProvider`.

You can import the following Apollo Client hooks from `"@apollo/experimental-nextjs-app-support/ssr"` in your client components (make sure you are not importing these hooks from `@apollo/client` as this package wraps and re-exports them to support streaming SSR):
- `useQuery`
- `useSuspenseQuery`
- `useBackgroundQuery`
- `useReadQuery`
- `useFragment`

If you want to make the most of the streaming SSR features offered by React & the Next.js App Router, consider using the [`useSuspenseQuery`](https://www.apollographql.com/docs/react/api/react/hooks-experimental/#using-usesuspensequery_experimental) and [`useFragment`](https://www.apollographql.com/docs/react/api/react/hooks-experimental/#using-usefragment_experimental) hooks.

### Resetting singletons between tests.
This package uses some singleton instances on the Browser side - if you are writing tests, you must reset them between tests.

For that, you can use the `resetNextSSRApolloSingletons` helper:

```ts
import { resetNextSSRApolloSingletons } from "@apollo/experimental-nextjs-app-support/ssr";

afterEach(resetNextSSRApolloSingletons);
```

## Handling Multipart responses in SSR

Generally, `useSuspenseQuery` will only suspend until the initial response is received.
In most cases, you get a full response, but if you use multipart response features like the `@defer` directive, you will only get a partial response.  
Without further handling, your component will now render with partial data - but the request will still keep running in the background. This is a worst-case scenario because your server will have to bear the load of that request, but the client will not get the complete data anyways. 
To handle this, you can apply one of two different strategies:

- remove `@defer` fragments from your query
- wait for deferred data to be received

For this, we ship the two links `RemoveMultipartDirectivesLink` and `AccumulateMultipartResponsesLink`, as well as the `SSRMultipartLink`, which combines both of them into a more convenient-to-use Link.

You can also check out the [Hack The Supergraph example](./examples/hack-the-supergraph-ssr), which shows this in use and allows you to adjust the speed deferred interfaces resolve in.

### Removing `@defer` fragments from your query with `RemoveMultipartDirectivesLink`

Usage example:

```ts
new RemoveMultipartDirectivesLink({
  /**
   * Whether to strip fragments with `@defer` directives
   * from queries before sending them to the server.
   *
   * Defaults to `true`.
   *
   * Can be overwritten by adding a label starting
   * with either `"SsrDontStrip"` or `"SsrStrip"` to the
   * directive.
   */
  stripDefer: true,
});
```

This link will (if called with `stripDefer: true`) strip all `@defer` fragments from your query.

You can exclude certain fragments from this behavior by giving them a label starting with `"SsrDontStrip"`.

Example:

```graphql
query myQuery {
  fastField
  ... @defer(label: "SsrDontStrip1") {
    slowField1
  }
  ... @defer(label: "SsrDontStrip2") {
    slowField2
  }
}
```

You can also use the link with `stripDefer: false` and mark certain fragments to be stripped by giving them a label starting with `"SsrStrip"`.

### Waiting for deferred data to be received with `AccumulateMultipartResponsesLink`

Usage example:

```ts
new AccumulateMultipartResponsesLink({
  /**
   * The maximum delay in milliseconds
   * from receiving the first response
   * until the accumulated data will be flushed
   * and the connection will be closed.
   */
  cutoffDelay: 100,
});
```

This link can be used to "debounce" the initial response of a multipart request. Any incremental data received during the `cutoffDelay` time will be merged into the initial response.

After `cutoffDelay`, the link will return the initial response, even if there is still incremental data pending, and close the network connection.

If `cutoffDelay` is `0`, the link will immediately return data as soon as it is received, without waiting for incremental data, and immediately close the network connection.

### Combining both: `SSRMultipartLink`

Usage example:

```ts
new SSRMultipartLink({
  /**
   * Whether to strip fragments with `@defer` directives
   * from queries before sending them to the server.
   *
   * Defaults to `true`.
   *
   * Can be overwritten by adding a label starting
   * with either `"SsrDontStrip"` or `"SsrStrip"` to the
   * directive.
   */
  stripDefer: true,
  /**
   * The maximum delay in milliseconds
   * from receiving the first response
   * until the accumulated data will be flushed
   * and the connection will be closed.
   *
   * Defaults to `0`.
   */
  cutoffDelay: 100,
});
```

This link combines the behavior of `RemoveMultipartDirectivesLink` and `AccumulateMultipartResponsesLink` into a single link.

### Debugging

If you want more information on what data is sent over the wire, enable logging in your `app/ApolloWrapper.ts`:

```ts
import { setVerbosity } from "ts-invariant";
setVerbosity("debug");
```
