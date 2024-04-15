import { gql } from "@apollo/client/index.js";
import type { WatchQueryOptions, DocumentNode } from "@apollo/client/index.js";
import { print } from "@apollo/client/utilities/index.js";
import { stripIgnoredCharacters } from "graphql";

export type TransportedOptions = { query: string } & Omit<
  WatchQueryOptions,
  "query"
>;

export function serializeOptions<T extends WatchQueryOptions<any, any>>(
  options: T
): { query: string } & Omit<T, "query"> {
  return {
    ...options,
    query: printMinified(options.query),
  };
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
