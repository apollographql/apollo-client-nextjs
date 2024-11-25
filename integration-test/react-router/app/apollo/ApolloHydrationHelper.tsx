import { useApolloClient } from "@apollo/client/index.js";
import { useMemo, useState } from "react";
import { useMatches } from "react-router";
import {
  isTransportedQueryRef,
  reviveTransportedQueryRef,
} from "./createQueryPreloader";

export function ApolloHydrationHelper(props: { children: React.ReactNode }) {
  const [hydrated] = useState(new WeakSet());
  const client = useApolloClient();
  const matches = useMatches();
  useMemo(() => {
    for (const match of matches) {
      const data = match.data;
      if (!data || hydrated.has(data)) continue;
      hydrated.add(data);

      JSON.stringify(match.data, (key, value) => {
        if (isTransportedQueryRef(value) && !value._hydrated) {
          value._hydrated = true;
          Object.assign(value, reviveTransportedQueryRef(value, client));
        }
        return value;
      });
    }
  }, [matches, client, hydrated]);
  return props.children;
}
