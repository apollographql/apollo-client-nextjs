// @ts-check

/** @type{import('knip').KnipConfig}*/
const config = {
  workspaces: {
    "packages/*": {
      entry: ["**/*.test.{ts,tsx}"],
      project: ["**/*.{ts,tsx}"],
    },
  },
  ignore: [
    "examples/**",
    "integration-test/**",
    "packages/test-utils/**",
    "scripts/**",
    "packages/client-react-streaming/api-extractor.d.ts",
    "packages/experimental-nextjs-app-support/api-extractor.d.ts",
  ],
  ignoreBinaries: ["jq", "playwright"],
  ignoreDependencies: [/@size-limit\/.*/, "prettier", "tsx"],
};

export default config;
