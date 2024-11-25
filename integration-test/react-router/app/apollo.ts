import { InMemoryCache } from "@apollo/client-react-streaming";
import { ApolloClient } from "./apollo/ApolloClient";
import { createApolloLoaderHandler } from "./apollo/preloader";

export const makeClient = (request?: Request) => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    uri: "https://graphqlzero.almansi.me/api",
  });
};
export const apolloLoader = createApolloLoaderHandler(makeClient);
