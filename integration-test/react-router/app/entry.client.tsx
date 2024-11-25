import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { makeClient } from "./apollo";
import { ApolloProvider } from "@apollo/client/index.js";

startTransition(() => {
  // TODO
  const client =
    makeClient() as any as import("@apollo/client/index.js").ApolloClient<any>;
  hydrateRoot(
    document,
    <StrictMode>
      <ApolloProvider client={client}>
        <HydratedRouter />
      </ApolloProvider>
    </StrictMode>
  );
});
