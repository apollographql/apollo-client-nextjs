import { gql } from "@apollo/client/index.js";
import type {
  WatchQueryOptions,
  DocumentNode,
  WatchQueryFetchPolicy,
} from "@apollo/client/index.js";
import { print } from "@apollo/client/utilities/index.js";
import { stripIgnoredCharacters } from "graphql";

export type TransportedOptions = { query: string } & Omit<
  WatchQueryOptions,
  "query"
>;

export function serializeOptions<T extends WatchQueryOptions<any, any>>(
  options: T
): { query: string; nextFetchPolicy: WatchQueryFetchPolicy | undefined } & Omit<
  T,
  "query"
> {
  assertSerializable(options);

  return {
    ...options,
    query: printMinified(options.query),
  };
}

function assertSerializable<T extends WatchQueryOptions<any, any>>(
  options: T
): asserts options is T & {
  nextFetchPolicy: WatchQueryFetchPolicy | undefined;
} {
  if (typeof options.nextFetchPolicy == "function") {
    throw new Error(
      "The `nextFetchPolicy` option cannot be a functions, as that cannot be serialized over the wire."
    );
  }
}

export function deserializeOptions(
  options: TransportedOptions
): WatchQueryOptions {
  return {
    ...options,
    // `gql` memoizes results, but based on the input string.
    // We parse-stringify-parse here to ensure that our minified query
    // has the best chance of being the referential same query as the one used in
    // client-side code.
    query: gql(print(gql(options.query))),
  };
}

function printMinified(query: DocumentNode): string {
  return stripIgnoredCharacters(print(query));
}
