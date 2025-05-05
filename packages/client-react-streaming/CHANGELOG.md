# @apollo/client-react-streaming

## 0.12.3-alpha.5

## 0.12.2

### Patch Changes

- c1db3fd: Call `removeQuery` instead of `stopQuery` to be more compatible with Apollo Client 4.0.

## 0.12.1

### Patch Changes

- 1957588: Fix dependencies to require React 19 and Next.js 15.
  This should already have been part of the 0.12 release, but was forgotten.

  - React 19 is required for the new mechanism behind `PreloadQuery`
  - Next.js 15 is a consequence of that. As versions prior to `15.2.3` had a security vulnerability, we chose that as the minimal supported version.

## 0.12.0

### Minor Changes

- 8209093: Implement multipart streaming support with `@defer` for `PreloadQuery`
- 20ce0c8: add `TeeToReadableStreamLink` and `ReadFromReadableStreamLink`

### Patch Changes

- dd2c972: Adjust imports to use the `@apollo/client/react` entrypoint for React-specific imports.
- c1e2415: Remove `_hydrated` property on transported queryRefs, use `WeakMap` instead.
- 3b6eca6: Added a warning when calling the `query` shortcut of `registerApolloClient` outside of a RSC (e.g. in Server Actions or Middleware).
  This could cause situations where users would accidentally create multiple Apollo Client instances.
- 9a8c872: Start an alpha branch
- 563db9b: add support for `useSuspenseFragment`

## 0.12.0-alpha.4

### Patch Changes

- 3b6eca6: Added a warning when calling the `query` shortcut of `registerApolloClient` outside of a RSC (e.g. in Server Actions or Middleware).
  This could cause situations where users would accidentally create multiple Apollo Client instances.

## 0.12.0-alpha.3

### Patch Changes

- c1e2415: Remove `_hydrated` property on transported queryRefs, use `WeakMap` instead.

## 0.11.11

### Patch Changes

- 372cf0c: Add an optimiziation to minimize reexecution of React components during hydration.

## 0.12.0-alpha.2

### Patch Changes

- dd2c972: Adjust imports to use the `@apollo/client/react` entrypoint for React-specific imports.

## 0.11.10

### Patch Changes

- 37941aa: Adjust imports to use the `@apollo/client/react` entrypoint for React-specific imports.

## 0.12.0-alpha.1

## 0.12.0-alpha.0

### Minor Changes

- 8209093: Implement multipart streaming support for `PreloadQuery`
- 20ce0c8: add `TeeToReadableStreamLink` and `ReadFromReadableStreamLink`

### Patch Changes

- 9a8c872: Start an alpha branch
- 563db9b: add support for `useSuspenseFragment`

## 0.11.9

### Patch Changes

- aaf041c: `createInjectionTransformStream`: fix handling if `</head>` is chopped up into multiple chunks

## 0.11.8

### Patch Changes

- 251bec9: Change package publishing to Changesets
- 2f779cd: Add missing `peerDependencies`: `react-dom` and `graphql`
