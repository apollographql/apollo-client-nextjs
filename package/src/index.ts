import {
  ApolloClient,
  useQuery as _useQuery,
  useMutation as _useMutation,
} from "@apollo/client";
import { invariant } from "@apollo/client/utilities/globals";
import { requestAsyncStorage } from "next/dist/client/components/request-async-storage";

const apolloSymbol = Symbol.for("ApolloClient");

interface ApolloSingletons {
  client?: ApolloClient<unknown>;
  // TODO also add suspense cache here and have that registered
}

declare module "next/dist/client/components/request-async-storage" {
  export interface RequestStore {
    [apolloSymbol]?: ApolloSingletons;
  }
}

let globalMakeClient: () => ApolloClient<any> = () => {
  invariant(
    false,
    "You need to call `registerApolloClient` before using the global Apollo Client"
  );
};

export function registerApolloClient(makeClient: () => ApolloClient<any>) {
  globalMakeClient = makeClient;
}

const clientApolloSingletons: ApolloSingletons = {};

export const getClient = (): ApolloClient<any> => {
  let apolloSingletons: ApolloSingletons;
  if (typeof window === "undefined") {
    if (!(globalThis as any).AsyncLocalStorage) {
      // we are in a context where `requestAsyncStorage` is not available, we have no way of doing singletons - create a new client
      return globalMakeClient();
    }
    const store = requestAsyncStorage.getStore();
    invariant(
      store,
      `Method expects to have requestAsyncStorage, none available`
    );
    apolloSingletons = store[apolloSymbol] ??= {};
  } else {
    apolloSingletons = clientApolloSingletons;
  }

  apolloSingletons.client ??= globalMakeClient();

  return apolloSingletons.client;
};

export const useQuery: typeof _useQuery = (query, options) => {
  const client = getClient();
  return _useQuery(query, { client, ...options });
};

export const useMutation: typeof _useMutation = (query, options) => {
  const client = getClient();
  return _useMutation(query, { client, ...options });
};
