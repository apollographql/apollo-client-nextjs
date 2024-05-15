import { makeExecutableSchema } from "@graphql-tools/schema";
import gql from "graphql-tag";
import * as entryPoint from "@apollo/client-react-streaming";
import type { IResolvers } from "@graphql-tools/utils";

const typeDefs = gql`
  type Product {
    id: String!
    title: String!
  }
  type Query {
    products(someArgument: String): [Product!]!
    env: String!
  }
`;

const resolvers = {
  Query: {
    products: async () => [
      {
        id: "product:5",
        title: "Soft Warm Apollo Beanie",
      },
      {
        id: "product:2",
        title: "Stainless Steel Water Bottle",
      },
      {
        id: "product:3",
        title: "Athletic Baseball Cap",
      },
      {
        id: "product:4",
        title: "Baby Onesies",
      },
      {
        id: "product:1",
        title: "The Apollo T-Shirt",
      },
      {
        id: "product:6",
        title: "The Apollo Socks",
      },
    ],
    env: (source, args, context) => {
      return context && context.from === "network"
        ? "browser"
        : "built_for_ssr" in entryPoint
          ? "SSR"
          : "built_for_browser" in entryPoint
            ? "Browser"
            : "built_for_rsc" in entryPoint
              ? "RSC"
              : "unknown";
    },
  },
} satisfies IResolvers;

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
