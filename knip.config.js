/** @type{import('knip').KnipConfig}*/
const config = {
  ignore: [
    "examples/**",
    "integration-test/**",
    "packages/test-utils/**",
    "scripts/**",
    "packages/client-react-streaming/api-extractor.d.ts",
    "packages/experimental-nextjs-app-support/api-extractor.d.ts",
  ],
  ignoreBinaries: ["jq", "playwright"],
  ignoreDependencies: [/@size-limit\/.*/, "prettier", "semver"],
};

export default config;
