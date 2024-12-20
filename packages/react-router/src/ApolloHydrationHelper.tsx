import { useApolloClient } from "@apollo/client/index.js";
import * as React from "react";
import { useMatches } from "react-router";
import {
  isTransportedQueryRef,
  reviveTransportedQueryRef,
} from "@apollo/client-react-streaming";

export function ApolloHydrationHelper(props: { children: React.ReactNode }) {
  const [hydrated] = React.useState(new WeakSet());
  const client = useApolloClient();
  const matches = useMatches();
  React.useMemo(() => {
    for (const match of matches) {
      const data = match.data;
      if (!data || hydrated.has(data)) continue;
      hydrated.add(data);

      JSON.stringify(match.data, (_key, value) => {
        if (isTransportedQueryRef(value)) {
          reviveTransportedQueryRef(value, client);
        }
        return value;
      });
    }
  }, [matches, client, hydrated]);
  return props.children;
}
