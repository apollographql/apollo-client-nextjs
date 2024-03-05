import { useContext } from "react";
import { buildManualDataTransport } from "@apollo/client-react-streaming/experimental-manual-transport";
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
