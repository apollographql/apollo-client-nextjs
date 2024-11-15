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

export interface DeferredDynamicProductResult {
  products: {
    id: string;
    title: string;
    rating: string | undefined;
  }[];
  env: string;
}
export const DEFERRED_QUERY: TypedDocumentNode<
  DeferredDynamicProductResult,
  { someArgument?: string; delayDeferred: number }
> = gql`
  query dynamicProducts($delayDeferred: Int!, $someArgument: String) {
    products(someArgument: $someArgument) {
      id
      title
      ... @defer {
        rating(delay: $delayDeferred)
      }
    }
    env
  }
`;
