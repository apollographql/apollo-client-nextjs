import { ApolloLink, HttpLink, InMemoryCache } from "@apollo/client/index.js";
import {
  createApolloLoaderHandler,
  ApolloClient,
} from "@apollo/client-integration-react-router";
import { IncrementalSchemaLink } from "@integration-test/shared/IncrementalSchemaLink";
import { schema } from "@integration-test/shared/schema";

const link =
  typeof window === "undefined"
    ? (new IncrementalSchemaLink({ schema }) as any as ApolloLink)
    : new HttpLink({ uri: "/graphql" });

export const makeClient = (request?: Request) => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link,
  });
};
export const apolloLoader = createApolloLoaderHandler(makeClient);
