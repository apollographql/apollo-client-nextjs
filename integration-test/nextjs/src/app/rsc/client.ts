import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc";

import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { setVerbosity } from "ts-invariant";
import { delayLink } from "@/shared/delayLink";
import { SchemaLink } from "@apollo/client/link/schema";

import { schema } from "../graphql/schema";

setVerbosity("debug");
loadDevMessages();
loadErrorMessages();

export const { getClient } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: delayLink.concat(
      typeof window === "undefined"
        ? new SchemaLink({ schema })
        : new HttpLink({
            uri: "/graphql",
          })
    ),
  });
});
