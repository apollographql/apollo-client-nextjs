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
      "@apollo/client-react-streaming/experimental-manual-transport",
      "react",
      "rehackt",
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
    entry("other", "src/empty.ts", "empty"),
    entry("rsc", "src/rsc/index.ts", "rsc/index"),
    entry("rsc", "src/ssr/index.rsc.ts", "ssr/index.rsc"),
    entry("ssr", "src/ssr/index.ts", "ssr/index.ssr"),
    entry("browser", "src/ssr/index.ts", "ssr/index.browser"),
  ];
});
