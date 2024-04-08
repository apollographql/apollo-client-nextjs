import type { DocumentNode } from "@apollo/client/index.js";
import { print } from "@apollo/client/utilities/index.js";

export function printMinified(query: DocumentNode): string {
  return (
    print(query)
      // replace multi-spaces with single space
      .replace(/\s{2,}/g, " ")
      // remove spaces that are preceeded by braces
      .replace(/(?<=[{}])\s+/g, "")
      // remove spaces that are preceeding braces
      .replace(/\s+(?=[{}])/g, "")
      .trim()
  );
}
