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
      const insertHtml = useContext(ServerInsertedHTMLContext);
      if (!insertHtml) {
        throw new Error(
          "ApolloNextAppProvider cannot be used outside of the Next App Router!"
        );
      }
      return insertHtml;
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
