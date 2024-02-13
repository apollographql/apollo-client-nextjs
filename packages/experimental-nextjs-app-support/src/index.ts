import { useContext } from "rehackt";
import {
  buildManualDataTransport,
  resetManualSSRApolloSingletons,
} from "@apollo/client-react-streaming/experimental-manual-transport";
import { ExperimentalReactDataTransport } from "@apollo/client-react-streaming/experimental-react-transport";
import { WrapApolloProvider } from "@apollo/client-react-streaming";
import { ServerInsertedHTMLContext } from "next/navigation.js";

export const ApolloNextAppProvider = /*#__PURE__*/ WrapApolloProvider(
  buildManualDataTransport(ExperimentalReactDataTransport)
);

export const resetNextSSRApolloSingletons = resetManualSSRApolloSingletons;
export {
  WrappedInMemoryCache as NextSSRInMemoryCache,
  WrappedApolloClient as NextSSRApolloClient,
  useBackgroundQuery,
  useFragment,
  useQuery,
  useReadQuery,
  useSuspenseQuery,
  SSRMultipartLink,
  DebounceMultipartResponsesLink,
  RemoveMultipartDirectivesLink,
} from "@apollo/client-react-streaming";
