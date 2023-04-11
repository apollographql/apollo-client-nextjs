import type { ApolloClient } from "@apollo/client";
import { invariant } from "@apollo/client/utilities/globals";
import {
  RequestAsyncStorage,
  requestAsyncStorage,
  RequestStore,
} from "next/dist/client/components/request-async-storage";
import React from "react";

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

type Wrappable =
  | typeof import("@apollo/client/react").useQuery
  | typeof import("@apollo/client/react").useMutation;
function withClient<T extends Wrappable>(useWrappedHook: T): T {
  if (useWrappedHook.length == 1) {
    // @ts-expect-error this is quite hacky
    return (arg) => {
      const client = getClient();
      // @ts-expect-error this is quite hacky
      return useWrappedHook({ ...arg, client });
    };
  }
  if (useWrappedHook.length == 2) {
    // @ts-expect-error this is quite hacky
    return (query, arg) => {
      const client = getClient();
      // @ts-expect-error this is quite hacky
      return useWrappedHook(query, { ...arg, client });
    };
  }
  throw new Error("incompatible hook passed in");
}

export function registerApolloClient(makeClient: () => ApolloClient<any>) {
  globalMakeClient = makeClient;
  return { withClient, getClient };
}

const clientApolloSingletons: ApolloSingletons = {};
let cacheFunction: (() => ApolloSingletons) | undefined;

function isServer() {
  return typeof window === "undefined";
}

function cacheAvailable() {
  try {
    React.cache(() => void 0)();
  } catch {
    return false;
  }
  return true;
}

type RequestAsyncStorageInRightEnvironment = Omit<
  RequestAsyncStorage,
  "getStore"
> & {
  getStore: () => RequestStore;
};
function asyncLocalStorageAvailable(
  asyncStorage: RequestAsyncStorage
): asyncStorage is RequestAsyncStorageInRightEnvironment {
  return /*(globalThis as any).AsyncLocalStorage && */ !!requestAsyncStorage.getStore();
}

function getSingleton(): ApolloSingletons | null {
  if (cacheAvailable()) {
    cacheFunction ??= React.cache(() => ({}));
    console.log("using cache");
    return cacheFunction();
  } else if (isServer()) {
    if (asyncLocalStorageAvailable(requestAsyncStorage)) {
      // Next classic SSR
      const store = requestAsyncStorage.getStore();
      console.log("using asyncLocalStorage");
      return (store[apolloSymbol] ??= {});
    } else {
      // we are in a context where `requestAsyncStorage` is not available, we have no way of doing singletons - create a new client
      console.log("no singleton possible");
      console.trace();
      return null;
    }
  } else {
    console.log("using module singleton");
    return clientApolloSingletons;
  }
}

function getClient(): ApolloClient<any> {
  const apolloSingletons = getSingleton();
  if (!apolloSingletons) {
    return globalMakeClient();
  }

  apolloSingletons.client ??= globalMakeClient();

  return apolloSingletons.client;
}

export { getClient as unchecked_getClient };
