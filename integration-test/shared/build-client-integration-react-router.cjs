/*
The integration tests need the latest version of the `@apollo/client-react-streaming` package.

This script can be used with the `exec:` protocol (https://yarnpkg.com/protocol/exec) to build
the package.
*/

const { join } = require("node:path");
const { $, cd, retry, sleep } = /** @type {typeof import('zx')} */ (
  require(require.resolve("zx", { paths: [process.env.PROJECT_CWD] }))
);

$.stdio = "inherit";

(async function run() {
  const monorepoRoot = join(process.env.PROJECT_CWD, "..");
  const archive = join(monorepoRoot, "packages/react-router/archive.tgz");

  // give the main build script a chance to kick in
  await sleep(1000);

  await retry(120, "1s", () => $`test -f ${archive}`);

  cd(monorepoRoot);
  await $`tar -x -z --strip-components=1 -f ${archive} -C ${execEnv.buildDir}`;
})();
