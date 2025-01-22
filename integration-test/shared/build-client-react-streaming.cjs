/*
The integration tests need the latest version of the `@apollo/client-react-streaming` package.

This script can be used with the `exec:` protocol (https://yarnpkg.com/protocol/exec) to build
the package.
*/

const { join } = require("node:path");
const { $, cd } = /** @type {typeof import('zx')} */ (
  require(require.resolve("zx", { paths: [process.env.PROJECT_CWD] }))
);
$.stdio = "inherit";

(async function run() {
  const monorepoRoot = join(process.env.PROJECT_CWD, "..");
  const archive = join(
    monorepoRoot,
    "packages/client-react-streaming/archive.tgz"
  );

  cd(monorepoRoot);
  await $`yarn workspaces foreach --all --include '@apollo/*' exec rm -vf archive.tgz`;
  await $`yarn workspaces foreach --all --include '@apollo/*' pack --out archive.tgz`;
  await $`tar -x -z --strip-components=1 -f ${archive} -C ${execEnv.buildDir}`;
})();
