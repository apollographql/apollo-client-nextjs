import { TypedDocumentNode, gql } from "@apollo/client";

export interface DynamicProductResult {
  products: {
    id: string;
    title: string;
  }[];
  env: string;
}
export const QUERY: TypedDocumentNode<
  DynamicProductResult,
  { someArgument?: string }
> = gql`
  query dynamicProducts($someArgument: String) {
    products(someArgument: $someArgument) {
      id
      title
    }
    env
  }
`;
