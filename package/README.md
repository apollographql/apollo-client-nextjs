# Apollo Client for Next.js

## What does this do?

### How does rendering in the `app` directory work?

Rendering in the `app` directory goes through a bunch of phases:

1. static generation: React Server Components
2. static generation: SSR
3. dynamic generation: React Server Components
4. dynamic generation: SSR
5. browser rendering

Here is a list of features that are supported in each phase:

| Feature | static RSC | static SSR | dynamic RSC | dynamic SSR | browser |
| ------- | ---------- | ---------- | ----------- | ----------- | ------- |
| Context | ❌ | ✅ | ❌ | ✅ | ✅ |
| Hooks | ❌ | ✅ | ❌ | ✅ | ✅ |
| cookies/headers | ❌ | ❌ | ✅ | ❌ | ❌ |

## Usage

> ❗️ **We do handle "RSC" and "SSR" use cases as completely separate.**  
You should generally try not to have overlapping queries between the two, as all queries made in SSR can dynamically update in the browser as the cache updates (e.g. from a mutation or another query), but queries made in RSC will not be updated in the browser - for that purpose, the full page would need to rerender. As a result, any overlapping data would result in inconsistencies in your UI.  
So decide for yourself, which queries you want to make in RSC and which in SSR, and don't have them overlap.

### In RSC
 
Create an `ApolloClient.js` file:
```js
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { registerApolloClient } from "@apollo/experimental-next";

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

If you use the `app` directory, every of your components *will* be SSR-rendered. So you will need to use this package.

First, create a new file `app/ApolloWrapper.js`:
```js
"use client";
// ^ this file needs the "use client" pragma

import { ApolloClient, HttpLink, SuspenseCache } from "@apollo/client";
import {
  ApolloNextAppProvider,
  NextSSRInMemoryCache,
} from "@apollo/experimental-next/ssr";

// have a function to create a client for you
function makeClient() {
  return new ApolloClient({
    // use the `NextSSRInMemoryCache`, not the normal `InMemoryCache`
    cache: new NextSSRInMemoryCache(),
    link: new HttpLink({
      // this needs to be an absolute url, as relative urls cannot be used in SSR
      uri: "https://example.com/api/graphql",
      // you can disable result caching here if you want to
      // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
      fetchOptions: { cache: "no-store" },
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
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>
            {children}
        </ApolloWrapper>
      </body>
    </html>
  );
}
```
> ☝️ This will work even if your layout is a React Server Component and will also allow the children of the layout to be React Server Components.  
It just makes sure that all Client Components will have access to the same Apollo Client instance, shared through the `ApolloNextAppProvider`.

Now you can use the hooks `useQuery`, `useSuspenseQuery`, `useFragment` and `useApolloClient` from `"@apollo/experimental-next/ssr"` in your Client components like you are used to.

## Roadmap

## Support for Apollo in Next app dir React Server Components

* [ ] share client instance between multiple requests made in the same render

## Support for Apollo in Next app dir SSR

* [x] enable use of React hooks in SSR
  * [x] `useApolloClient` (no changes needed)
  * [x] `useSuspenseQuery`
  * [x] `useFragment`
  * [x] `useQuery` (will not make requests on server, but will use cache values that have been added by `useSuspenseQuery`)
  * [ ] `useBackgroundQuery`
  * [ ] useSubscription (what would support look like?)
  * [ ] ~~useMutation~~ (not going to support this)
  * [ ] ~~useLazyQuery~~ (not going to support this)
* [ ] support `@defer`
  * [ ] stage 1: add a link that will stop requests immediately after the non-deferred data is received
  * [ ] stage 2: allow configuration of a "timeout" so "fast" deferred responses will be forwarded to the client
    * [ ] implementation on link level
    * [ ] implementation on cache level
* [x] rehydrate the exact hook status on the browser
* [x] forward incoming query responses to the browser (works, but not optimal: see [React RFC: injectToStream](https://github.com/reactjs/rfcs/pull/219#issuecomment-1505084590) )

## Support for Apollo in Next `getServerSideProps` and `getStaticProps`

* [ ] evaluate if we still add this at this point or concentrate on app dir RSC & SSR
