import type { Options } from "tsup";
import { defineConfig } from "tsup";

const defaultConfig = (options: Options): Options => ({
  splitting: false,
  sourcemap: true,
  format: ["cjs", "esm"],
  target: "node18",
  dts: true,
  treeshake: !options.watch,
  outDir: "dist/",
});

function addEnvironment(entrypoints: Record<string, string>, env: string) {
  return Object.fromEntries(
    Object.entries(entrypoints).map(([name, path]) => [`${name}.${env}`, path])
  );
}

const ssrEntryPoints = {
  "ssr/index": "src/ssr/index.ts",
  "ssr/next": "src/ssr/NextJs/index.ts",
  "ssr/manual": "src/ssr/Manual/index.ts",
};

export default defineConfig((options) => [
  {
    ...defaultConfig(options),
    entry: {
      "rsc/index": "src/rsc/index.ts",
      empty: "src/empty.ts",
    },
  },
  {
    ...defaultConfig(options),
    entry: addEnvironment(ssrEntryPoints, "ssr"),
    env: {
      REACT_ENV: "ssr",
    },
  },
  {
    ...defaultConfig(options),
    entry: addEnvironment(ssrEntryPoints, "browser"),
    target: ["chrome109", "firefox115", "safari16", "edge119", "ios15"],
    env: {
      REACT_ENV: "browser",
    },
  },
]);
