import { useContext } from "rehackt";
import {
  buildManualDataTransport,
  resetManualSSRApolloSingletons,
} from "@apollo/experimental-nextjs-app-support/manual";
import { WrapApolloProvider } from "@apollo/experimental-nextjs-app-support/core";
import { ServerInsertedHTMLContext } from "next/navigation.js";

export const ApolloNextAppProvider = /*#__PURE__*/ WrapApolloProvider(
  buildManualDataTransport({
    useInsertHtml() {
      return useContext(ServerInsertedHTMLContext);
    },
  })
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
} from "@apollo/experimental-nextjs-app-support/core";
