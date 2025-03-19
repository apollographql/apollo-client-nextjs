import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { makeClient } from "./apollo";
import { ApolloProvider } from "@apollo/client/react/index.js";
import { initializeApolloContext } from "@apollo/client-integration-react-router";

startTransition(() => {
  const client = makeClient();
  hydrateRoot(
    document,
    <StrictMode>
      <ApolloProvider client={client}>
        <HydratedRouter
          unstable_getContext={() => {
            const context = new Map();
            // set other context values here
            return initializeApolloContext(client, context);
          }}
        />
        {/* if you have no other context values, as a shortcut */}
        {/* <HydratedRouter unstable_getContext={() => initializeApolloContext(client)} /> */}
      </ApolloProvider>
    </StrictMode>
  );
});
