export { WrappedInMemoryCache } from "./WrappedInMemoryCache.js";
export { WrappedApolloClient } from "./WrappedApolloClient.js";

export {
  useFragment,
  useQuery,
  useSuspenseQuery,
  useReadQuery,
  useBackgroundQuery,
} from "./hooks.js";
export { SSRMultipartLink } from "./SSRMultipartLink.js";
export { AccumulateMultipartResponsesLink as DebounceMultipartResponsesLink } from "./AccumulateMultipartResponsesLink.js";
export { RemoveMultipartDirectivesLink } from "./RemoveMultipartDirectivesLink.js";
export { resetApolloSingletons } from "./testHelpers.js";

export { DataTransportContext } from "./DataTransportAbstraction.js";
export type { DataTransportProviderImplementation } from "./DataTransportAbstraction.js";
export { WrapApolloProvider } from "./WrapApolloProvider.js";
