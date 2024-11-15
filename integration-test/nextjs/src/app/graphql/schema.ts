import { makeExecutableSchema } from "@graphql-tools/schema";
import gql from "graphql-tag";
import * as entryPoint from "@apollo/client-react-streaming";
import type { IResolvers } from "@graphql-tools/utils";

const typeDefs = gql`
  directive @defer(
    if: Boolean! = true
    label: String
  ) on FRAGMENT_SPREAD | INLINE_FRAGMENT

  type Product {
    id: String!
    title: String!
    rating(delay: Int!): String!
  }

  type Query {
    products(someArgument: String): [Product!]!
    env: String!
  }
`;

const products = [
  {
    id: "product:5",
    title: "Soft Warm Apollo Beanie",
    rating: "5/5",
  },
  {
    id: "product:2",
    title: "Stainless Steel Water Bottle",
    rating: "5/5",
  },
  {
    id: "product:3",
    title: "Athletic Baseball Cap",
    rating: "5/5",
  },
  {
    id: "product:4",
    title: "Baby Onesies",
    rating: "cuteness overload",
  },
  {
    id: "product:1",
    title: "The Apollo T-Shirt",
    rating: "5/5",
  },
  {
    id: "product:6",
    title: "The Apollo Socks",
    rating: "5/5",
  },
];

const resolvers = {
  Query: {
    products: async () => products.map(({ id, title }) => ({ id, title })),
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
  Product: {
    rating: (source, args) => {
      return new Promise((resolve) =>
        setTimeout(
          resolve,
          Math.random() * 2 * args.delay,
          products.find((p) => p.id === source.id)?.rating
        )
      );
    },
  },
} satisfies IResolvers;

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
