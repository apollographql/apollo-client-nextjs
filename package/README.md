# Apollo Client for Next.js

> ❗️ This package is experimental, and just like the NextJS `app` directory itself, it is not yet ready for production use.

## Why do you need this?

### React Server Components

If you want to use Apollo Client in your Next.js app with React Server Components, you will need a way of creating a client instance that is shared between all your server components for one request, to prevent making duplicate requests.

### React Client Components

When using the `app` directory, all your "client components" will not only run in the browser. They will also be rendered on the server - in a "SSR" run that will execute after React Server Components have been rendered.

If you want to make the most of your application, you probably already want to make your GraphQL requests on the server, so that the page is already fully rendered when it reaches the browser.

This package provides the tools necessary to execute your GraphQL queries on the server, and to use the results to hydrate your browser-side cache and components.

### How does rendering in the `app` directory work?

Rendering in the `app` directory goes through a bunch of phases:

1. static generation: React Server Components
2. static generation: SSR
3. dynamic generation: React Server Components
4. dynamic generation: SSR
5. browser rendering

Here is a list of features that are supported in each phase:

| Feature         | static RSC | static SSR | dynamic RSC | dynamic SSR | browser |
| --------------- | ---------- | ---------- | ----------- | ----------- | ------- |
| "use client"    | ❌         | ✅         | ❌          | ✅          | ✅      |
| "use server"    | ✅         | ❌         | ✅          | ❌          | ❌      |
| Context         | ❌         | ✅         | ❌          | ✅          | ✅      |
| Hooks           | ❌         | ✅         | ❌          | ✅          | ✅      |
| cookies/headers | ❌         | ❌         | ✅          | ❌          | ❌      |

## Usage

> ❗️ **We do handle "RSC" and "SSR" use cases as completely separate.**  
> You should generally try not to have overlapping queries between the two, as all queries made in SSR can dynamically update in the browser as the cache updates (e.g. from a mutation or another query), but queries made in RSC will not be updated in the browser - for that purpose, the full page would need to rerender. As a result, any overlapping data would result in inconsistencies in your UI.  
> So decide for yourself, which queries you want to make in RSC and which in SSR, and don't have them overlap.

### In RSC

Create an `ApolloClient.js` file:

```js
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { registerApolloClient } from "@apollo/experimental-next/rsc";

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

If you use the `app` directory, every of your components _will_ be SSR-rendered. So you will need to use this package.

First, create a new file `app/ApolloWrapper.js`:

```js
"use client";
// ^ this file needs the "use client" pragma

import { byEnv } from "@apollo/experimental-next";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  SuspenseCache,
} from "@apollo/client";
import {
  ApolloNextAppProvider,
  NextSSRInMemoryCache,
  SSRMultipartLink,
} from "@apollo/experimental-next/ssr";

// have a function to create a client for you
function makeClient() {
  const httpLink = new HttpLink({
      // this needs to be an absolute url, as relative urls cannot be used in SSR
      uri: "https://example.com/api/graphql",
      // you can disable result caching here if you want to
      // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
      fetchOptions: { cache: "no-store" },
    });

  return new ApolloClient({
    // use the `NextSSRInMemoryCache`, not the normal `InMemoryCache`
    cache: new NextSSRInMemoryCache(),
    link: byEnv({
      SSR: () =>
        ApolloLink.from([
          // in a SSR environment, if you use multipart features like
          // @defer, you need to decide how to handle these.
          // This strips all `@defer` directives from your queries.
          new SSRMultipartLink({
            stripDefer: true,
          }),
          httpLink,
        ]),
      default: () => httpLink,
    }),
  });
}

// also have a function to create a suspense cache
function makeSuspenseCache() {
  return new SuspenseCache();
}

// you need to create a component to wrap your app in
export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider
      makeClient={makeClient}
      makeSuspenseCache={makeSuspenseCache}
    >
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

Now you can use the hooks `useQuery`, `useSuspenseQuery`, `useFragment` and `useApolloClient` from `"@apollo/experimental-next/ssr"` in your Client components like you are used to.

## Handling Multipart responses in SSR

Generally, `useSuspenseQuery` will always only suspense until the initial response is received.
In mosty cases that means that you get a full response, but if you are using multipart response features like the `@defer` directive, you will only get a partial response.  
Without further handling, at that point your the component will now render with partial data - but the request itself will still keep running in the background. This is a worst-case scenario, because your server will have to bear the load of that request, but the client will not get the full data anyways.  
For handling this, you can apply one of two different strategies:
* remove `@defer` fragments from your query
* wait for deferred data to be received

For this, we ship the two links `RemoveMultipartDirectivesLink` and `DebounceMultipartResponsesLink`, as well as the `SSRMultipartLink` which combines both of them into a more convenient-to-use Link.

### Removing `@defer` fragments from your query with `RemoveMultipartDirectivesLink`

Usage example:
```ts
new RemoveMultipartDirectivesLink({
  stripDefer: true, // defaults to `true`
})
```

This link will (if called with `stripDefer: true`) strip all `@defer` fragments from your query.

You can exclude certain fragments from this behaviour by giving them a label starting with `"SSRdontStrip"`.

Example:
```graphql
 query myQuery {
   fastField
   ... @defer(label: "SSRdontStrip1") {
     slowField1 
   }
   ... @defer(label: "SSRdontStrip2") {
     slowField2 
   }
 }
 ```

You can also use the link with `stripDefer: false` and mark certain fragments to be stripped by giving them a label starting with `"SSRstrip"`.

### Waiting for deferred data to be received with `DebounceMultipartResponsesLink`

Usage example:

```ts
new DebounceMultipartResponsesLink({
    maxDelay: 100, // in ms, required
  })
```

This link can be used to "debounce" the initial response of a multipart request. Any incremental data received during the `maxDelay` time will be merged into the initial response.

After `maxDelay`, the link will return the initial response, even if there is still incremental data pending, and close the network connection.

If `maxDelay` is `0`, the link will immediately return data as soon as it is received, without waiting for incremental data, and immediately close the network connection.

### Combining both: `SSRMultipartLink`

Usage example:

```ts
new SSRMultipartLink({
  stripDefer: true, // defaults to `true`
  maxDelay: 100, // in ms, defaults to 0
})
```

This link combines the behaviour of both `RemoveMultipartDirectivesLink` and `DebounceMultipartResponsesLink` into a single link.

### other APIs

- `detectEnvironment`  
  Signature:  
  ```ts
  function detectEnvironment(log?: string): "staticRSC" | "dynamicRSC" | "staticSSR" | "dynamicSSR" | "Browser"
  ```
  This function can be used to detect the current environment your code is being executed in.
  If you pass in a string argument, it will also output more information about the environment to the console.

- `byEnv`  
  Signature:  
  ```ts
  function byEnv<T>(options: {
    staticRSC?: () => T;
    dynamicRSC?: () => T;
    RSC?: () => T;
    staticSSR?: () => T;
    dynamicSSR?: () => T;
    SSR?: () => T;
    Browser?: () => T;
    default?: () => T;
  }): T;
  ```
  This function can be used to select different values depending on the environment your code is being executed in.  
  More specific values will take precedence over less specific ones.  
  Example:
  ```js
  const value = byEnv({
    RSC: () => "I'm running in a React Server Component - static or dynamic!",
    staticSSR: () => "This client component is currently rendering in static SSR!",
    SSR: () => "I'm running in SSR. Since the static case is already covered explicitly, it's gonna be dynamic SSR.",
    Browser: () => "I'm running in the browser",
    default: () => "Will be returned if the matching case has been omitted",
  });
  ```


## Roadmap

## Support for Apollo in Next app dir React Server Components

- [ ] share client instance between multiple requests made in the same render

## Support for Apollo in Next app dir SSR

- [x] enable use of React hooks in SSR
  - [x] `useApolloClient` (no changes needed)
  - [x] `useSuspenseQuery`
  - [x] `useFragment`
  - [x] `useQuery` (will not make requests on server, but will use cache values that have been added by `useSuspenseQuery`)
  - [ ] `useBackgroundQuery`
  - [ ] useSubscription (what would support look like?)
  - [ ] ~~useMutation~~ (not going to support this)
  - [ ] ~~useLazyQuery~~ (not going to support this)
- [ ] support `@defer`
  - [ ] stage 1: add a link that will stop requests immediately after the non-deferred data is received
  - [ ] stage 2: allow configuration of a "timeout" so "fast" deferred responses will be forwarded to the client
    - [ ] implementation on link level
    - [ ] implementation on cache level
- [x] rehydrate the exact hook status on the browser
- [x] forward incoming query responses to the browser (works, but not optimal: see [React RFC: injectToStream](https://github.com/reactjs/rfcs/pull/219#issuecomment-1505084590) )

## Support for Apollo in legacy SSR in Next with `getServerSideProps` and `getStaticProps`

- [ ] evaluate if we still add this at this point or concentrate on app dir RSC & SSR
