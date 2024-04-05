import { ApolloSSRDataTransport } from "./ApolloRehydrateSymbols.js";
import type { RehydrationCache } from "./types.js";
import { registerLateInitializingQueue } from "./lateInitializingQueue.js";
import { invariant } from "ts-invariant";
import { htmlEscapeJsonString } from "./htmlescape.js";
import type { QueryEvent } from "@apollo/client-react-streaming";

export type JSONResult = { undefined: string; value: any };

export type DataTransport<T> = Array<T> | { push(...args: T[]): void };

type DataToTransport = {
  rehydrate: RehydrationCache;
  events: QueryEvent[];
};

/**
 * Returns a string of JavaScript that can be used to transport data to the client.
 */
export function transportDataToJS(data: DataToTransport) {
  const key = Symbol.keyFor(ApolloSSRDataTransport);
  return `(window[Symbol.for("${key}")] ??= []).push(${htmlEscapeJsonString(
    stringify(data)
  )})`;
}

/**
 * Registers a lazy queue that will be filled with data by `transportDataToJS`.
 * All incoming data will be added either to the rehydration cache or the result cache.
 */
export function registerDataTransport({
  onQueryEvent,
  onRehydrate,
}: {
  onQueryEvent(event: QueryEvent): void;
  onRehydrate(rehydrate: RehydrationCache): void;
}) {
  registerLateInitializingQueue(ApolloSSRDataTransport, (data) => {
    const parsed = revive(data) as DataToTransport;
    invariant.debug(`received data from the server:`, parsed);
    onRehydrate(parsed.rehydrate);
    for (const result of parsed.events) {
      onQueryEvent(result);
    }
  });
}

/**
 * Stringifies a value. Pairs with `revive` to also preserve `undefined`.
 */
export function stringify(value: any) {
  let undefinedPlaceholder = "$u";

  const stringified = JSON.stringify(value);
  while (stringified.includes(`"${undefinedPlaceholder}"`)) {
    undefinedPlaceholder = "$" + undefinedPlaceholder;
  }
  return JSON.stringify(
    { undefined: undefinedPlaceholder, value } satisfies JSONResult,
    (_, v) => (v === undefined ? undefinedPlaceholder : v)
  );
}

export function revive({
  undefined: undefinedPlaceholder,
  value,
}: JSONResult): any {
  // we create a clone so we can modify it
  const cloned = structuredClone(value);
  // use JSON.stringify for traversal
  JSON.stringify(cloned, (_, v) => {
    if (typeof v === "object") {
      for (const k in v) {
        if (v[k] === undefinedPlaceholder) {
          v[k] = undefined;
        }
      }
    }
    return v;
  });
  return cloned;
}
