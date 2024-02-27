export { InMemoryCache } from "./WrappedInMemoryCache.js";
export { ApolloClient } from "./WrappedApolloClient.js";

export {
  useFragment,
  useQuery,
  useSuspenseQuery,
  useReadQuery,
  useBackgroundQuery,
} from "./hooks.js";
export { resetApolloSingletons } from "./testHelpers.js";

export { DataTransportContext } from "./DataTransportAbstraction.js";
export type { DataTransportProviderImplementation } from "./DataTransportAbstraction.js";
export { WrapApolloProvider } from "./WrapApolloProvider.js";