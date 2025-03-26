---
"@apollo/client-react-streaming": patch
---

Added a warning when calling the `query` shortcut of `registerApolloClient` outside of a RSC (e.g. in Server Actions or Middleware).
This could cause situations where users would accidentally create multiple Apollo Client instances.
