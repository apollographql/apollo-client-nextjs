import type { DocumentNode } from "@apollo/client/index.js";
import { print } from "@apollo/client/utilities/index.js";
import { stripIgnoredCharacters } from "graphql";

export function printMinified(query: DocumentNode): string {
  return stripIgnoredCharacters(print(query));
}
