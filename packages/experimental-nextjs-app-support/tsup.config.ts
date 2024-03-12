import type { Options } from "tsup";
import { defineConfig } from "tsup";
import type { Plugin } from "esbuild";

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
      "@apollo/client-react-streaming",
      "@apollo/client-react-streaming/manual-transport",
      "react",
      "rehackt",
    ],
    noExternal: ["@apollo/client"], // will be handled by `acModuleImports`
    esbuildPlugins: [acModuleImports],
  };

  function entry(
    env: "browser" | "ssr" | "rsc" | "other",
    input: string,
    output: string
  ): Options {
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
    entry("other", "src/empty.ts", "empty"),
    entry("rsc", "src/rsc/index.ts", "rsc/index"),
    entry("rsc", "src/ssr/index.rsc.ts", "ssr/index.rsc"),
    entry("ssr", "src/ssr/index.ts", "ssr/index.ssr"),
    entry("browser", "src/ssr/index.ts", "ssr/index.browser"),
  ];
});

const acModuleImports: Plugin = {
  name: "replace-ac-module-imports",
  setup(build) {
    build.onResolve({ filter: /^@apollo\/client/ }, async (args) => {
      if (build.initialOptions.define["TSUP_FORMAT"] === '"cjs"') {
        // remove trailing `/index.js` in CommonJS builds
        return { path: args.path.replace(/\/index.js$/, ""), external: true };
      }
      return { path: args.path, external: true };
    });
  },
};
