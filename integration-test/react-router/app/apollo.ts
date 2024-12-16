import { InMemoryCache } from "@apollo/client/index.js";
import {
  createApolloLoaderHandler,
  ApolloClient,
} from "@apollo/client-integration-react-router";

export const makeClient = (request?: Request) => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    uri: "https://graphqlzero.almansi.me/api",
  });
};
export const apolloLoader = createApolloLoaderHandler(makeClient);
