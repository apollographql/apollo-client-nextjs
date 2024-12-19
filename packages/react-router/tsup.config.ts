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
      "@apollo/client-integration-react-router",
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
      footer(ctx) {
        return {
          js:
            ctx.format === "esm"
              ? `export const built_for_${env} = true;`
              : `exports.built_for_${env} = true;`,
        };
      },
    };
  }

  return [entry("browser", "src/index.ts", "index")];
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
