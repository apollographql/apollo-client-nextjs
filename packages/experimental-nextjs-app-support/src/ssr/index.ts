export { ApolloNextAppProvider } from "../ApolloNextAppProvider.js";
export { resetManualSSRApolloSingletons as resetNextSSRApolloSingletons } from "@apollo/client-react-streaming/manual-transport";
import { ApolloClient } from "@apollo/client-react-streaming";
import { bundle } from "../bundleInfo.js";
export {
  InMemoryCache as NextSSRInMemoryCache,
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
/**
 * A version of `ApolloClient` to be used with streaming SSR.
 *
 * For more documentation, please see {@link https://www.apollographql.com/docs/react/api/core/ApolloClient | the Apollo Client API documentation}.
 *
 * @public
 */
export class NextSSRApolloClient<
  TCacheShape,
> extends ApolloClient<TCacheShape> {
  protected info = bundle;
}
