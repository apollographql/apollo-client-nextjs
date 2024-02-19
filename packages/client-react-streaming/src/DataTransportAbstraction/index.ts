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
export { resetApolloSingletons } from "./testHelpers.js";

export { DataTransportContext } from "./DataTransportAbstraction.js";
export type { DataTransportProviderImplementation } from "./DataTransportAbstraction.js";
export { WrapApolloProvider } from "./WrapApolloProvider.js";
