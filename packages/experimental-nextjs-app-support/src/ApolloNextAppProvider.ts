import { useContext } from "react";
import { buildManualDataTransport } from "@apollo/client-react-streaming/manual-transport";
import { WrapApolloProvider } from "@apollo/client-react-streaming";
import { ServerInsertedHTMLContext } from "next/navigation.js";
import { bundle } from "./bundleInfo.js";

/**
 * > This export is only available in React Client Components
 *
 * A version of `ApolloProvider` to be used with the Next.js App Router.
 *
 * As opposed to the normal `ApolloProvider`, this version does not require a `client` prop,
 * but requires a `makeClient` prop instead.
 *
 * Use this component together with `NextSSRApolloClient` and `NextSSRInMemoryCache`
 * to make an ApolloClient instance available to your Client Component hooks in the
 * Next.js App Router.
 *
 * @example
 * `app/ApolloWrapper.jsx`
 * ```tsx
 * function makeClient() {
 *   const httpLink = new HttpLink({
 *     uri: "https://example.com/api/graphql",
 *   });
 *
 *   return new NextSSRApolloClient({
 *     cache: new NextSSRInMemoryCache(),
 *     link: httpLink,
 *   });
 * }
 *
 * export function ApolloWrapper({ children }: React.PropsWithChildren) {
 *   return (
 *     <ApolloNextAppProvider makeClient={makeClient}>
 *       {children}
 *     </ApolloNextAppProvider>
 *   );
 * }
 * ```
 *
 * @public
 */
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
ApolloNextAppProvider.info = bundle;
