import { useContext } from "react";
import {
  buildManualDataTransport,
  resetManualSSRApolloSingletons,
} from "../Manual";
import { WrapApolloProvider } from "../";
import { ServerInsertedHTMLContext } from "next/navigation";

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
} from "..";
