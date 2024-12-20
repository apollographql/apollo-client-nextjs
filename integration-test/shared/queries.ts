import { TypedDocumentNode, gql } from "@apollo/client/index.js";

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
    rating: undefined | { value: string; env: string };
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
        rating(delay: $delayDeferred) {
          value
          env
        }
      }
    }
    env
  }
`;
