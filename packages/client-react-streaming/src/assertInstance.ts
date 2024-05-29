import type { bundle } from "./bundleInfo.js";
import { sourceSymbol } from "./bundleInfo.js";

export function assertInstance(
  value: { [sourceSymbol]?: string },
  info: typeof bundle,
  name: string
): void {
  if (value[sourceSymbol] !== `${info.pkg}:${name}`) {
    throw new Error(
      `When using \`${name}\` in streaming SSR, you must use the \`${name}\` export provided by \`"${info.pkg}"\`.`
    );
  }
}
