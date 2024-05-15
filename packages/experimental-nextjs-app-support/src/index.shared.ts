export {
  SSRMultipartLink,
  DebounceMultipartResponsesLink,
  RemoveMultipartDirectivesLink,
  InMemoryCache,
  type TransportedQueryRef,
} from "@apollo/client-react-streaming";
import { bundle } from "./bundleInfo.js";
import { ApolloClient as UpstreamApolloClient } from "@apollo/client-react-streaming";

/**
 * A version of `ApolloClient` to be used with streaming SSR or in React Server Components.
 *
 * For more documentation, please see {@link https://www.apollographql.com/docs/react/api/core/ApolloClient | the Apollo Client API documentation}.
 *
 * @public
 */
export class ApolloClient<
  TCacheShape,
> extends UpstreamApolloClient<TCacheShape> {
  /**
   * Information about the current package and it's export names, for use in error messages.
   *
   * @internal
   */
  static readonly info = bundle;
}
