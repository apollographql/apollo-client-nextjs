import { cacheSlot } from "@apollo/client/cache/index.js";

const hookRegex = /use((Background|Suspense|Read|)Query|Fragment)/;
declare module globalThis {
  const __DEV__: boolean | undefined;
}

// reuse the constructor of `cacheSlot` so we don't need to add a dependency on `optimism`.
export const hookSlot =
  new (cacheSlot.constructor as typeof import("optimism").Slot)<boolean>();

export function ensureNotCalledFromUnwrappedHook() {
  if (globalThis.__DEV__ !== false) {
    // was called from a correct hook - we don't need any more checks
    if (hookSlot.getValue() === true) return;
    // otherwise, it could be called from a hook or from userland.
    // we only want to warn on hooks code, so we need to detect a call from a hook
    // this will only work in non-minified code (development?) by looking at the stack trace.
    try {
      throw new Error();
    } catch (e) {
      const match = hookRegex.exec((e as Error).stack || "");
      if (match) {
        try {
          throw new Error();
        } catch (e) {
          console.warn(
            `
          You are using the hook ${match[0]} directly from the \`@apollo/client\` package.
          Please use the corresponding hook from <pkgname> instead.
          `, // we still need some way of communicating the right package name here
            e
          );
        }
      }
    }
  }
}
