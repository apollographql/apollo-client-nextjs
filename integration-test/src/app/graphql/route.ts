import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { ApolloServer } from "@apollo/server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { gql } from "graphql-tag";

const typeDefs = gql`
  type Product {
    id: String!
    title: String!
  }
  type Query {
    products: [Product!]!
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
  },
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const server = new ApolloServer({
  schema,
});

const handler = startServerAndCreateNextHandler(server);

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
