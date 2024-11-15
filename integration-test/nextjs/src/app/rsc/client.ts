import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from "@apollo/experimental-nextjs-app-support";

import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { setVerbosity } from "ts-invariant";
import { delayLink } from "@/shared/delayLink";
import { errorLink } from "@/shared/errorLink";

import { schema } from "../graphql/schema";
import { IncrementalSchemaLink } from "../graphql/IncrementalSchemaLink";

setVerbosity("debug");
loadDevMessages();
loadErrorMessages();

export const { getClient, PreloadQuery, query } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: delayLink.concat(
      errorLink.concat(new IncrementalSchemaLink({ schema }))
    ),
  });
});
