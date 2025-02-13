/**
 * TypeScript does not have the concept of these environments,
 * so we need to create a single entry point that combines all
 * possible exports.
 * That means that users will be offered "RSC" exports in a
 * "SSR/Browser" code file, but those will error in a compilation
 * step.
 *
 * This is a limitation of TypeScript, and we can't do anything
 * about it.
 *
 * The build process will only create `.d.ts`/`d.cts` files from
 * this, and not actual runtime code.
 */

export * from "./index.rsc.js";
export * from "./index.js";
