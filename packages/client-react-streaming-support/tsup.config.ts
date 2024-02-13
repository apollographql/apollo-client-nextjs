import type { Options } from "tsup";
import { defineConfig } from "tsup";

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
      "react",
      "rehackt",
      "@apollo/client",
    ],
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
    {
      ...entry("other", "src/combined.ts", "combined"),
      dts: { only: true },
    },
    entry("other", "src/empty.ts", "empty"),
    entry("rsc", "src/index.rsc.ts", "index.rsc"),
    entry("ssr", "src/index.ts", "index.ssr"),
    entry("browser", "src/index.ts", "index.browser"),
    entry(
      "ssr",
      "src/ExperimentalManualDataTransport/index.ts",
      "experimental-manual.ssr"
    ),
    entry(
      "browser",
      "src/ExperimentalManualDataTransport/index.ts",
      "experimental-manual.browser"
    ),
    entry("ssr", "src/ExperimentalReact/index.ts", "experimental-react.ssr"),
    entry(
      "browser",
      "src/ExperimentalReact/index.ts",
      "experimental-react.browser"
    ),
  ];
});
