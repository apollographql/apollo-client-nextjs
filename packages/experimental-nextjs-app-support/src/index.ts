import { useContext } from "react";
import {
  buildManualDataTransport,
  resetManualSSRApolloSingletons,
} from "@apollo/client-react-streaming/experimental-manual-transport";
import { WrapApolloProvider } from "@apollo/client-react-streaming";
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
  InMemoryCache,
  ApolloClient,
  useBackgroundQuery,
  useFragment,
  useQuery,
  useReadQuery,
  useSuspenseQuery,
  SSRMultipartLink,
  DebounceMultipartResponsesLink,
  RemoveMultipartDirectivesLink,
} from "@apollo/client-react-streaming";

/*
work around bundling error: 
error TS2742: The inferred type of 'NextSSRInMemoryCache' cannot be named without a reference to '@apollo/client-react-streaming/node_modules/@apollo/client'. 
This is likely not portable. A type annotation is necessary.
 */
import type {} from "@apollo/client";

import { ApolloClient, InMemoryCache } from "@apollo/client-react-streaming";
/**
 * @deprecated
 * use `InMemoryCache` from the `@apollo/experimental-nextjs-app-support` package instead
 */
export const NextSSRInMemoryCache = InMemoryCache;
/**
 * @deprecated
 * use `ApolloClient` from the `@apollo/experimental-nextjs-app-support` package instead
 */
export const NextSSRApolloClient = ApolloClient;
