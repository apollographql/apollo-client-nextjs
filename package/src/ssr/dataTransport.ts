import SuperJSON from "superjson";
import {
  ApolloSSRDataTransport,
  ApolloRehydrationCache,
  ApolloResultCache,
  ApolloBackgroundQueryTransport,
} from "./ApolloRehydrateSymbols";
import type { RehydrationCache } from "./types";
import { registerLateInitializingQueue } from "./lateInitializingQueue";
import type { Cache, WatchQueryOptions } from "@apollo/client";
import invariant from "ts-invariant";
import { htmlEscapeJsonString } from "../util/htmlescape";

export type DataTransport<T> = Array<T> | { push(...args: T[]): void };

type DataToTransport = {
  rehydrate: RehydrationCache;
  results: Cache.WriteOptions[];
  backgroundQueries: WatchQueryOptions[];
};

/**
 * Returns a string of JavaScript that can be used to transport data to the client.
 */
export function transportDataToJS(data: DataToTransport) {
  const key = Symbol.keyFor(ApolloSSRDataTransport);
  return `(window[Symbol.for("${key}")] ??= []).push(${htmlEscapeJsonString(
    SuperJSON.stringify(data)
  )})`;
}

/**
 * Registers a lazy queue that will be filled with data by `transportDataToJS`.
 * All incoming data will be added either to the rehydration cache or the result cache.
 */
export function registerDataTransport() {
  registerLateInitializingQueue(ApolloSSRDataTransport, (data) => {
    const parsed = SuperJSON.deserialize<DataToTransport>(data);
    invariant.debug(`received data from the server:`, parsed);
    Object.assign((window[ApolloRehydrationCache] ??= {}), parsed.rehydrate);
    (window[ApolloBackgroundQueryTransport] ??= []).push(
      ...parsed.backgroundQueries
    );
    (window[ApolloResultCache] ??= []).push(...parsed.results);
  });
}
