import { gql, type WatchQueryOptions } from "@apollo/client/index.js";
import type { DocumentNode } from "@apollo/client/index.js";
import { print } from "@apollo/client/utilities/index.js";
import { stripIgnoredCharacters } from "graphql";

export type TransportedOptions = { query: string } & Omit<
  WatchQueryOptions,
  "query"
>;

export function serializeOptions(
  options: WatchQueryOptions<any>
): TransportedOptions {
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
    query: gql(options.query),
  };
}

function printMinified(query: DocumentNode): string {
  return stripIgnoredCharacters(print(query));
}
