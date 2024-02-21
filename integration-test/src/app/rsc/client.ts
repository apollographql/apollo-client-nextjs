import { HttpLink } from "@apollo/client";
import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from "@apollo/experimental-nextjs-app-support";

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
