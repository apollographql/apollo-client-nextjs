import type { Options } from "tsup";
import { defineConfig } from "tsup";

function addEnvironment(entrypoints: Record<string, string>, env: string) {
  return Object.fromEntries(
    Object.entries(entrypoints).map(([name, path]) => [`${name}.${env}`, path])
  );
}

const ssrEntryPoints = {
  "ssr/index": "src/ssr/index.ts",
  "ssr/next": "src/ssr/NextJs/index.ts",
  manual: "src/ssr/Manual/index.ts",
};

export default defineConfig((options) => {
  const defaults: Options = {
    splitting: false,
    sourcemap: true,
    format: ["cjs", "esm"],
    target: "node18",
    dts: true,
    treeshake: !options.watch,
    outDir: "dist/",
    external: [
      "@apollo/experimental-nextjs-app-support",
      "@apollo/experimental-nextjs-app-support/core",
      "@apollo/experimental-nextjs-app-support/manual",
      "@apollo/experimental-nextjs-app-support/next",
    ],
  };

  function entry(
    env: "browser" | "ssr" | "rsc",
    input: string,
    output: string
  ) {
    return {
      ...defaults,
      env: {
        REACT_ENV: env,
      },
      target:
        env === "browser"
          ? ["chrome109", "firefox115", "safari16", "edge119", "ios15"]
          : defaults.target,
      entry: {
        [output]: input,
      },
    };
  }

  return [
    {
      ...defaults,
      entry: {
        combined: "src/combined.ts",
        empty: "src/empty.ts",
      } as Record<string, string>,
    },
    entry("rsc", "src/rsc/index.ts", "rsc/index"),
    entry("ssr", "src/ssr/index.ts", "ssr/index.ssr"),
    entry("browser", "src/ssr/index.ts", "ssr/index.browser"),
    entry("ssr", "src/ssr/Manual/index.ts", "ssr/manual.ssr"),
    entry("browser", "src/ssr/Manual/index.ts", "ssr/manual.browser"),
    entry("ssr", "src/ssr/NextJs/index.ts", "ssr/next.ssr"),
    entry("browser", "src/ssr/NextJs/index.ts", "ssr/next.browser"),
  ];
});
