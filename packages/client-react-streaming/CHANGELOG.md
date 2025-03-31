# @apollo/client-react-streaming

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
