export { WrappedInMemoryCache as NextSSRInMemoryCache } from "./WrappedInMemoryCache";
export { WrappedApolloClient as NextSSRApolloClient } from "./WrappedApolloClient";

export { ApolloNextAppProvider, resetNextSSRApolloSingletons } from "./NextJs";

export {
  useFragment,
  useQuery,
  useSuspenseQuery,
  useReadQuery,
  useBackgroundQuery,
} from "./hooks";
export { SSRMultipartLink } from "./SSRMultipartLink";
export { AccumulateMultipartResponsesLink as DebounceMultipartResponsesLink } from "./AccumulateMultipartResponsesLink";
export { RemoveMultipartDirectivesLink } from "./RemoveMultipartDirectivesLink";
export { resetApolloSingletons } from "./testHelpers";
