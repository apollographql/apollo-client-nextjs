import type { ApolloClient } from "@apollo/client";
import {
  RequestStore,
  requestAsyncStorage,
} from "next/dist/client/components/request-async-storage";
import { hasCreateContext } from "../detectEnvironment";

const ApolloClients = new WeakMap<RequestStore, ApolloClient<any>>();
export function registerApolloClient(makeClient: () => ApolloClient<any>) {
  return {
    getClient() {
      const requestStore = requestAsyncStorage.getStore();
      if (hasCreateContext() || !requestStore) {
        throw new Error(
          "`getClient` cannot be used in this environment. Please use the `useApolloClient` hook instead."
        );
      }
      let client = ApolloClients.get(requestStore);
      if (!client) {
        client = makeClient();
        ApolloClients.set(requestStore, client);
      }

      return client;
    },
  };
}
