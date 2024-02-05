import { useContext } from "react";
import {
  buildManualDataTransport,
  resetManualSSRApolloSingletons,
} from "../Manual";
import { WrapApolloProvider } from "../WrapApolloProvider";

import { ServerInsertedHTMLContext } from "next/navigation";
export const ApolloNextAppProvider = WrapApolloProvider(
  buildManualDataTransport({
    useInsertHtml() {
      return useContext(ServerInsertedHTMLContext);
    },
  })
);

export const resetNextSSRApolloSingletons = resetManualSSRApolloSingletons;
