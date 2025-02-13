/**
 * @packageDocumentation
 *
 * This package provides building blocks to create framework-level integration of Apollo Client with React's streaming SSR. See the [\@apollo/client-integration-nextjs](https://github.com/apollographql/apollo-client-nextjs/tree/main/packages/experimental-nextjs-app-support) package as an example.
 *
 * It can also be used to use Apollo Client with a custom streaming SSR setup, e.g. with Vite. See the [vite streaming integration test](https://github.com/apollographql/apollo-client-nextjs/tree/main/integration-test/vite-streaming) as an example.
 */

export * from "./dist/combined.d.ts";
export * from "./dist/manual-transport.ssr.d.ts";
