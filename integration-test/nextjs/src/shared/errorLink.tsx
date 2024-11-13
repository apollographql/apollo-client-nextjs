import { ApolloLink, Observable } from "@apollo/client";
import { GraphQLError, GraphQLFormattedError } from "graphql";
import * as entryPoint from "@apollo/client-react-streaming";

declare module "@apollo/client" {
  type Env = "ssr" | "browser" | "rsc";
  export interface DefaultContext {
    error?: "always" | Env | `${Env},${Env}`;
  }
}

export const errorLink = new ApolloLink((operation, forward) => {
  const context = operation.getContext();
  if (
    context.error === "always" ||
    ("built_for_ssr" in entryPoint &&
      context.error?.split(",").includes("ssr")) ||
    ("built_for_browser" in entryPoint &&
      context.error?.split(",").includes("browser")) ||
    ("built_for_rsc" in entryPoint && context.error?.split(",").includes("rsc"))
  ) {
    return new Observable((subscriber) => {
      subscriber.next({
        data: null,
        errors: [
          {
            message: "Simulated error",
          } satisfies GraphQLFormattedError as GraphQLError,
        ],
      });
    });
  }
  return forward(operation);
});
