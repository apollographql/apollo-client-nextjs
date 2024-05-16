export {
  InMemoryCache as NextSSRInMemoryCache,
  ApolloClient as NextSSRApolloClient,
  SSRMultipartLink,
  DebounceMultipartResponsesLink,
  RemoveMultipartDirectivesLink,
  ApolloNextAppProvider,
  resetApolloClientSingletons as resetNextSSRApolloSingletons,
  type TransportedQueryRef,
} from "@apollo/experimental-nextjs-app-support";
export {
  useBackgroundQuery,
  useFragment,
  useQuery,
  useReadQuery,
  useSuspenseQuery,
} from "@apollo/client/index.js";
