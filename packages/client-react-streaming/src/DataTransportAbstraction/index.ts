export { InMemoryCache } from "./WrappedInMemoryCache.js";
export { ApolloClient } from "./WrappedApolloClient.js";

export { resetApolloSingletons } from "./testHelpers.js";

export { DataTransportContext } from "./DataTransportAbstraction.js";
export type {
  DataTransportProviderImplementation,
  QueryEvent,
} from "./DataTransportAbstraction.js";
export {
  WrapApolloProvider,
  WrappedApolloProvider,
} from "./WrapApolloProvider.js";
