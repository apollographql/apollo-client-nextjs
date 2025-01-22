# @apollo/client-integration-react-router

This package provides integrations between Apollo Client and React Router 7 to support modern streaming SSR.

## Setup

Install dependencies:

```sh
npm i @apollo/client-integration-react-router @apollo/client graphql
```

Create an `app/apollo.ts` with that exports a `makeClient` function and an `apolloLoader` created with `createApolloLoaderHandler`:

```ts
import { ApolloLink, HttpLink, InMemoryCache } from "@apollo/client/index.js";
import {
  createApolloLoaderHandler,
  ApolloClient,
} from "@apollo/client-integration-react-router";

// `request` will be available on the server during SSR or in loaders, but not in the browser
export const makeClient = (request?: Request) => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({ uri: "https://your.graphql.api" }),
  });
};
export const apolloLoader = createApolloLoaderHandler(makeClient);
```

> [!IMPORTANT]  
> `ApolloClient` needs to be imported from `@apollo/client-integration-react-router`, not from `@apollo/client`.

Run `yarn react-router reveal`. This will create the files `app/entry.client.tsx` and `app/entry.server.tsx`.

Adjust `app/entry.client.tsx`:

```diff
+import { makeClient } from "./apollo";
+import { ApolloProvider } from "@apollo/client/index.js";

startTransition(() => {
+ const client = makeClient();
  hydrateRoot(
  document,
  <StrictMode>
+    <ApolloProvider client={client}>
       <HydratedRouter />
+    </ApolloProvider>
  </StrictMode>
  );
});
```

Adjust `app/entry.server.tsx`:

```diff
+import { makeClient } from "./apollo";
+import { ApolloProvider } from "@apollo/client/index.js";

export default function handleRequest(
  // ...
) {
  return new Promise((resolve, reject) => {
  // ...
+ const client = makeClient(request);
  const { pipe, abort } = renderToPipeableStream(
+   <ApolloProvider client={client}>
      <ServerRouter
        context={routerContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
+   </ApolloProvider>,
    {
      [readyOption]() {
        shellRendered = true;
```

Add `<ApolloHydrationHelper>` to `app/root.tsx`

```diff
+ import { ApolloHydrationHelper } from "@apollo/client-integration-react-router";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      // ...
      <body>
-        {children}
+        <ApolloHydrationHelper>{children}</ApolloHydrationHelper>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

### Temporary: patch React-Router

We are still waiting for a PR to React Router to get merged: https://github.com/remix-run/react-router/pull/12264

In the meantime, you unfortunately have to use something like `patch-package` or `yarn patch` to pull in that PR on your own. No worries, it's just a small type adjustment, so nothing scary!

You can use one of these patches:

<details>
<summary>

with `yarn patch`: `.yarn/patches/react-router-npm-7.0.2-b96f2bd13c.patch`

</summary>

```diff
diff --git a/dist/development/lib/types/route-module.d.mts b/dist/development/lib/types/route-module.d.mts
index c4553062633a6a1352378bfedb2c9dc7eaef94fb..762fd83a1ad06f940ba39c6552bd61cc5c4d1cf1 100644
--- a/dist/development/lib/types/route-module.d.mts
+++ b/dist/development/lib/types/route-module.d.mts
@@ -1,7 +1,9 @@
 import { av as LinkDescriptor, as as MetaDescriptor, aJ as ServerDataFrom, aK as ClientDataFrom, aL as Func, aM as Equal, aN as Pretty } from '../../route-data-DuV3tXo2.mjs';
 import { A as AppLoadContext } from '../../data-CQbyyGzl.mjs';
 import 'react';
-
+export type SerializesTo<T> = {
+    $__RR_SerializesTo?: [T];
+  };
 type IsDefined<T> = Equal<T, undefined> extends true ? false : true;
 type RouteModule = {
     meta?: Func;
diff --git a/dist/development/lib/types/route-module.d.ts b/dist/development/lib/types/route-module.d.ts
index a7b3449b84f7be4e7da9ce82ba6ac3ae3e30d64f..776fdbc13033eb82ce4de2b9026476e87e65c7f7 100644
--- a/dist/development/lib/types/route-module.d.ts
+++ b/dist/development/lib/types/route-module.d.ts
@@ -1,7 +1,9 @@
 import { av as LinkDescriptor, as as MetaDescriptor, aJ as ServerDataFrom, aK as ClientDataFrom, aL as Func, aM as Equal, aN as Pretty } from '../../route-data-DuV3tXo2.js';
 import { A as AppLoadContext } from '../../data-CQbyyGzl.js';
 import 'react';
-
+export type SerializesTo<T> = {
+    $__RR_SerializesTo?: [T];
+  };
 type IsDefined<T> = Equal<T, undefined> extends true ? false : true;
 type RouteModule = {
     meta?: Func;
diff --git a/dist/development/route-data-DuV3tXo2.d.mts b/dist/development/route-data-DuV3tXo2.d.mts
index 53dbfb38b8c2cd09bb944aeb17dd3951f2a157ad..d33adfc7147222f4e283487df804faeb95f2a4c8 100644
--- a/dist/development/route-data-DuV3tXo2.d.mts
+++ b/dist/development/route-data-DuV3tXo2.d.mts
@@ -1531,8 +1531,10 @@ type Func = (...args: any[]) => unknown;
 type Pretty<T> = {
     [K in keyof T]: T[K];
 } & {};
-
-type Serialize<T> = T extends Serializable ? T : T extends (...args: any[]) => unknown ? undefined : T extends Promise<infer U> ? Promise<Serialize<U>> : T extends Map<infer K, infer V> ? Map<Serialize<K>, Serialize<V>> : T extends Set<infer U> ? Set<Serialize<U>> : T extends [] ? [] : T extends readonly [infer F, ...infer R] ? [Serialize<F>, ...Serialize<R>] : T extends Array<infer U> ? Array<Serialize<U>> : T extends readonly unknown[] ? readonly Serialize<T[number]>[] : T extends Record<any, any> ? {
+export type SerializesTo<T> = {
+    $__RR_SerializesTo?: [T];
+  };
+type Serialize<T> = T extends SerializesTo<infer To> ? To : T extends Serializable ? T : T extends (...args: any[]) => unknown ? undefined : T extends Promise<infer U> ? Promise<Serialize<U>> : T extends Map<infer K, infer V> ? Map<Serialize<K>, Serialize<V>> : T extends Set<infer U> ? Set<Serialize<U>> : T extends [] ? [] : T extends readonly [infer F, ...infer R] ? [Serialize<F>, ...Serialize<R>] : T extends Array<infer U> ? Array<Serialize<U>> : T extends readonly unknown[] ? readonly Serialize<T[number]>[] : T extends Record<any, any> ? {
     [K in keyof T]: Serialize<T[K]>;
 } : undefined;
 type VoidToUndefined<T> = Equal<T, void> extends true ? undefined : T;
diff --git a/dist/development/route-data-DuV3tXo2.d.ts b/dist/development/route-data-DuV3tXo2.d.ts
index 53dbfb38b8c2cd09bb944aeb17dd3951f2a157ad..d33adfc7147222f4e283487df804faeb95f2a4c8 100644
--- a/dist/development/route-data-DuV3tXo2.d.ts
+++ b/dist/development/route-data-DuV3tXo2.d.ts
@@ -1531,8 +1531,10 @@ type Func = (...args: any[]) => unknown;
 type Pretty<T> = {
     [K in keyof T]: T[K];
 } & {};
-
-type Serialize<T> = T extends Serializable ? T : T extends (...args: any[]) => unknown ? undefined : T extends Promise<infer U> ? Promise<Serialize<U>> : T extends Map<infer K, infer V> ? Map<Serialize<K>, Serialize<V>> : T extends Set<infer U> ? Set<Serialize<U>> : T extends [] ? [] : T extends readonly [infer F, ...infer R] ? [Serialize<F>, ...Serialize<R>] : T extends Array<infer U> ? Array<Serialize<U>> : T extends readonly unknown[] ? readonly Serialize<T[number]>[] : T extends Record<any, any> ? {
+export type SerializesTo<T> = {
+    $__RR_SerializesTo?: [T];
+  };
+type Serialize<T> = T extends SerializesTo<infer To> ? To : T extends Serializable ? T : T extends (...args: any[]) => unknown ? undefined : T extends Promise<infer U> ? Promise<Serialize<U>> : T extends Map<infer K, infer V> ? Map<Serialize<K>, Serialize<V>> : T extends Set<infer U> ? Set<Serialize<U>> : T extends [] ? [] : T extends readonly [infer F, ...infer R] ? [Serialize<F>, ...Serialize<R>] : T extends Array<infer U> ? Array<Serialize<U>> : T extends readonly unknown[] ? readonly Serialize<T[number]>[] : T extends Record<any, any> ? {
     [K in keyof T]: Serialize<T[K]>;
 } : undefined;
 type VoidToUndefined<T> = Equal<T, void> extends true ? undefined : T;
diff --git a/dist/production/lib/types/route-module.d.mts b/dist/production/lib/types/route-module.d.mts
index c4553062633a6a1352378bfedb2c9dc7eaef94fb..762fd83a1ad06f940ba39c6552bd61cc5c4d1cf1 100644
--- a/dist/production/lib/types/route-module.d.mts
+++ b/dist/production/lib/types/route-module.d.mts
@@ -1,7 +1,9 @@
 import { av as LinkDescriptor, as as MetaDescriptor, aJ as ServerDataFrom, aK as ClientDataFrom, aL as Func, aM as Equal, aN as Pretty } from '../../route-data-DuV3tXo2.mjs';
 import { A as AppLoadContext } from '../../data-CQbyyGzl.mjs';
 import 'react';
-
+export type SerializesTo<T> = {
+    $__RR_SerializesTo?: [T];
+  };
 type IsDefined<T> = Equal<T, undefined> extends true ? false : true;
 type RouteModule = {
     meta?: Func;
diff --git a/dist/production/lib/types/route-module.d.ts b/dist/production/lib/types/route-module.d.ts
index a7b3449b84f7be4e7da9ce82ba6ac3ae3e30d64f..776fdbc13033eb82ce4de2b9026476e87e65c7f7 100644
--- a/dist/production/lib/types/route-module.d.ts
+++ b/dist/production/lib/types/route-module.d.ts
@@ -1,7 +1,9 @@
 import { av as LinkDescriptor, as as MetaDescriptor, aJ as ServerDataFrom, aK as ClientDataFrom, aL as Func, aM as Equal, aN as Pretty } from '../../route-data-DuV3tXo2.js';
 import { A as AppLoadContext } from '../../data-CQbyyGzl.js';
 import 'react';
-
+export type SerializesTo<T> = {
+    $__RR_SerializesTo?: [T];
+  };
 type IsDefined<T> = Equal<T, undefined> extends true ? false : true;
 type RouteModule = {
     meta?: Func;
```

</details>

<details>
<summary>

with `patch-package`: `patches/react-router+7.0.2.patch`

</summary>

```diff
diff --git a/node_modules/react-router/dist/development/lib/types/route-module.d.mts b/node_modules/react-router/dist/development/lib/types/route-module.d.mts
index c455306..762fd83 100644
--- a/node_modules/react-router/dist/development/lib/types/route-module.d.mts
+++ b/node_modules/react-router/dist/development/lib/types/route-module.d.mts
@@ -1,7 +1,9 @@
 import { av as LinkDescriptor, as as MetaDescriptor, aJ as ServerDataFrom, aK as ClientDataFrom, aL as Func, aM as Equal, aN as Pretty } from '../../route-data-DuV3tXo2.mjs';
 import { A as AppLoadContext } from '../../data-CQbyyGzl.mjs';
 import 'react';
-
+export type SerializesTo<T> = {
+    $__RR_SerializesTo?: [T];
+  };
 type IsDefined<T> = Equal<T, undefined> extends true ? false : true;
 type RouteModule = {
     meta?: Func;
diff --git a/node_modules/react-router/dist/development/lib/types/route-module.d.ts b/node_modules/react-router/dist/development/lib/types/route-module.d.ts
index a7b3449..776fdbc 100644
--- a/node_modules/react-router/dist/development/lib/types/route-module.d.ts
+++ b/node_modules/react-router/dist/development/lib/types/route-module.d.ts
@@ -1,7 +1,9 @@
 import { av as LinkDescriptor, as as MetaDescriptor, aJ as ServerDataFrom, aK as ClientDataFrom, aL as Func, aM as Equal, aN as Pretty } from '../../route-data-DuV3tXo2.js';
 import { A as AppLoadContext } from '../../data-CQbyyGzl.js';
 import 'react';
-
+export type SerializesTo<T> = {
+    $__RR_SerializesTo?: [T];
+  };
 type IsDefined<T> = Equal<T, undefined> extends true ? false : true;
 type RouteModule = {
     meta?: Func;
diff --git a/node_modules/react-router/dist/development/route-data-DuV3tXo2.d.mts b/node_modules/react-router/dist/development/route-data-DuV3tXo2.d.mts
index 53dbfb3..d33adfc 100644
--- a/node_modules/react-router/dist/development/route-data-DuV3tXo2.d.mts
+++ b/node_modules/react-router/dist/development/route-data-DuV3tXo2.d.mts
@@ -1531,8 +1531,10 @@ type Func = (...args: any[]) => unknown;
 type Pretty<T> = {
     [K in keyof T]: T[K];
 } & {};
-
-type Serialize<T> = T extends Serializable ? T : T extends (...args: any[]) => unknown ? undefined : T extends Promise<infer U> ? Promise<Serialize<U>> : T extends Map<infer K, infer V> ? Map<Serialize<K>, Serialize<V>> : T extends Set<infer U> ? Set<Serialize<U>> : T extends [] ? [] : T extends readonly [infer F, ...infer R] ? [Serialize<F>, ...Serialize<R>] : T extends Array<infer U> ? Array<Serialize<U>> : T extends readonly unknown[] ? readonly Serialize<T[number]>[] : T extends Record<any, any> ? {
+export type SerializesTo<T> = {
+    $__RR_SerializesTo?: [T];
+  };
+type Serialize<T> = T extends SerializesTo<infer To> ? To : T extends Serializable ? T : T extends (...args: any[]) => unknown ? undefined : T extends Promise<infer U> ? Promise<Serialize<U>> : T extends Map<infer K, infer V> ? Map<Serialize<K>, Serialize<V>> : T extends Set<infer U> ? Set<Serialize<U>> : T extends [] ? [] : T extends readonly [infer F, ...infer R] ? [Serialize<F>, ...Serialize<R>] : T extends Array<infer U> ? Array<Serialize<U>> : T extends readonly unknown[] ? readonly Serialize<T[number]>[] : T extends Record<any, any> ? {
     [K in keyof T]: Serialize<T[K]>;
 } : undefined;
 type VoidToUndefined<T> = Equal<T, void> extends true ? undefined : T;
diff --git a/node_modules/react-router/dist/development/route-data-DuV3tXo2.d.ts b/node_modules/react-router/dist/development/route-data-DuV3tXo2.d.ts
index 53dbfb3..d33adfc 100644
--- a/node_modules/react-router/dist/development/route-data-DuV3tXo2.d.ts
+++ b/node_modules/react-router/dist/development/route-data-DuV3tXo2.d.ts
@@ -1531,8 +1531,10 @@ type Func = (...args: any[]) => unknown;
 type Pretty<T> = {
     [K in keyof T]: T[K];
 } & {};
-
-type Serialize<T> = T extends Serializable ? T : T extends (...args: any[]) => unknown ? undefined : T extends Promise<infer U> ? Promise<Serialize<U>> : T extends Map<infer K, infer V> ? Map<Serialize<K>, Serialize<V>> : T extends Set<infer U> ? Set<Serialize<U>> : T extends [] ? [] : T extends readonly [infer F, ...infer R] ? [Serialize<F>, ...Serialize<R>] : T extends Array<infer U> ? Array<Serialize<U>> : T extends readonly unknown[] ? readonly Serialize<T[number]>[] : T extends Record<any, any> ? {
+export type SerializesTo<T> = {
+    $__RR_SerializesTo?: [T];
+  };
+type Serialize<T> = T extends SerializesTo<infer To> ? To : T extends Serializable ? T : T extends (...args: any[]) => unknown ? undefined : T extends Promise<infer U> ? Promise<Serialize<U>> : T extends Map<infer K, infer V> ? Map<Serialize<K>, Serialize<V>> : T extends Set<infer U> ? Set<Serialize<U>> : T extends [] ? [] : T extends readonly [infer F, ...infer R] ? [Serialize<F>, ...Serialize<R>] : T extends Array<infer U> ? Array<Serialize<U>> : T extends readonly unknown[] ? readonly Serialize<T[number]>[] : T extends Record<any, any> ? {
     [K in keyof T]: Serialize<T[K]>;
 } : undefined;
 type VoidToUndefined<T> = Equal<T, void> extends true ? undefined : T;
diff --git a/node_modules/react-router/dist/production/lib/types/route-module.d.mts b/node_modules/react-router/dist/production/lib/types/route-module.d.mts
index c455306..762fd83 100644
--- a/node_modules/react-router/dist/production/lib/types/route-module.d.mts
+++ b/node_modules/react-router/dist/production/lib/types/route-module.d.mts
@@ -1,7 +1,9 @@
 import { av as LinkDescriptor, as as MetaDescriptor, aJ as ServerDataFrom, aK as ClientDataFrom, aL as Func, aM as Equal, aN as Pretty } from '../../route-data-DuV3tXo2.mjs';
 import { A as AppLoadContext } from '../../data-CQbyyGzl.mjs';
 import 'react';
-
+export type SerializesTo<T> = {
+    $__RR_SerializesTo?: [T];
+  };
 type IsDefined<T> = Equal<T, undefined> extends true ? false : true;
 type RouteModule = {
     meta?: Func;
diff --git a/node_modules/react-router/dist/production/lib/types/route-module.d.ts b/node_modules/react-router/dist/production/lib/types/route-module.d.ts
index a7b3449..776fdbc 100644
--- a/node_modules/react-router/dist/production/lib/types/route-module.d.ts
+++ b/node_modules/react-router/dist/production/lib/types/route-module.d.ts
@@ -1,7 +1,9 @@
 import { av as LinkDescriptor, as as MetaDescriptor, aJ as ServerDataFrom, aK as ClientDataFrom, aL as Func, aM as Equal, aN as Pretty } from '../../route-data-DuV3tXo2.js';
 import { A as AppLoadContext } from '../../data-CQbyyGzl.js';
 import 'react';
-
+export type SerializesTo<T> = {
+    $__RR_SerializesTo?: [T];
+  };
 type IsDefined<T> = Equal<T, undefined> extends true ? false : true;
 type RouteModule = {
     meta?: Func;

```

</details>

## Usage

### Using `apolloLoader` with `useReadQuery`

You can now use the `apolloLoader` function to create Apollo-enabled loaders:

```ts
export const loader = apolloLoader<Route.LoaderArgs>()(({ preloadQuery }) => {
  const myQueryRef = preloadQuery(MY_QUERY, {
    variables: { someVariable: 1 },
  });
  return {
    myQueryRef,
  };
});
```

> [!IMPORTANT]  
> To provide you with better TypeScript support, this is a method that you need to call twice: `apolloLoader<LoaderArgs>()(loader)`

Then you can consume this `myQueryRef` object with `useReadQuery` in your component:

```ts
export default function Home() {
  const { myQueryRef } = useLoaderData<typeof loader>();

  const { data } = useReadQuery(myQueryRef);

  return (
    <div> do something with `data` here </div>
  )
```
