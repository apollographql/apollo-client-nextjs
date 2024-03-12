export { ApolloNextAppProvider } from "../ApolloNextAppProvider.js";
export { resetManualSSRApolloSingletons as resetNextSSRApolloSingletons } from "@apollo/client-react-streaming/manual-transport";
export {
  InMemoryCache as NextSSRInMemoryCache,
  ApolloClient as NextSSRApolloClient,
  SSRMultipartLink,
  DebounceMultipartResponsesLink,
  RemoveMultipartDirectivesLink,
} from "@apollo/client-react-streaming";
export {
  useBackgroundQuery,
  useFragment,
  useQuery,
  useReadQuery,
  useSuspenseQuery,
} from "@apollo/client/index.js";
