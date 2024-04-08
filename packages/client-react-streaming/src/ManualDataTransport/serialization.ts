/**
 * Stringifies a value to be injected into JavaScript "text" - preverves `undefined` values.
 */
export function stringify(value: any) {
  let undefinedPlaceholder = "$apollo.undefined$";

  const stringified = JSON.stringify(value);
  while (stringified.includes(JSON.stringify(undefinedPlaceholder))) {
    undefinedPlaceholder = "$" + undefinedPlaceholder;
  }
  return JSON.stringify(value, (_, v) =>
    v === undefined ? undefinedPlaceholder : v
  ).replaceAll(JSON.stringify(undefinedPlaceholder), "undefined");
}

export function revive(value: any): any {
  return value;
}

export type Stringify = typeof stringify;
export type Revive = typeof revive;
