import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "https://apollo-next-poll.up.railway.app/",
  documents: ["components/**/*.graphql"],
  generates: {
    "components/types.generated.ts": { plugins: ["typescript"] },
    "components/": {
      preset: "near-operation-file",
      presetConfig: {
        extension: ".generated.ts",
        baseTypesPath: "types.generated.ts",
      },
      plugins: ["typescript-operations", "typed-document-node"],
    },
  },
};

export default config;
