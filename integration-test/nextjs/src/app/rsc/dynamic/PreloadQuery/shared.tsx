import { TypedDocumentNode, gql } from "@apollo/client";

export interface DynamicProductResult {
  products: {
    id: string;
    title: string;
  }[];
  env: string;
}
export const QUERY: TypedDocumentNode<DynamicProductResult> = gql`
  query dynamicProducts {
    products {
      id
      title
    }
    env
  }
`;
