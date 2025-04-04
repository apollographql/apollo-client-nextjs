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
 * Use this component together with `ApolloClient` and `InMemoryCache`
 * from the `"@apollo/client-integration-nextjs"` package
 * to make an ApolloClient instance available to your Client Component hooks in the
 * Next.js App Router.
 *
 * @example
 * `app/ApolloWrapper.jsx`
 * ```tsx
 * import { HttpLink } from "@apollo/client";
 * import { ApolloNextAppProvider, ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
 *
 * function makeClient() {
 *   const httpLink = new HttpLink({
 *     uri: "https://example.com/api/graphql",
 *   });
 *
 *   return new ApolloClient({
 *     cache: new InMemoryCache(),
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
        if (process.env.REACT_ENV === "browser") {
          //Allow using the browser build of ApolloNextAppProvider outside of Next.js, e.g. for tests.
          return () => {};
        }
        throw new Error(
          "The SSR build of ApolloNextAppProvider cannot be used outside of the Next App Router!\n" +
            'If you encounter this in a test, make sure that your tests are using the browser build by adding the "browser" import condition to your test setup.'
        );
      }
      return insertHtml;
    },
  })
);
ApolloNextAppProvider.info = bundle;
