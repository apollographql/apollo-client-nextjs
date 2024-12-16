/*
The integration tests need the latest version of the `@apollo/client-react-streaming` package.

This script can be used with the `exec:` protocol (https://yarnpkg.com/protocol/exec) to build
the package.
*/

const { execFileSync } = require("node:child_process");
const { join, dirname } = require("node:path");
const monorepoRoot = dirname(
  require.resolve("monorepo", { paths: [process.env.INIT_CWD] })
);
const pathToArchive = join(execEnv.tempDir, "archive.tgz");

setTimeout(() => {
  execFileSync(
    `yarn`,
    [
      `workspace`,
      `@apollo/client-integration-react-router`,
      `pack`,
      `--out`,
      pathToArchive,
    ],
    {
      stdio: `inherit`,
      cwd: monorepoRoot,
    }
  );
  execFileSync(
    `tar`,
    [
      `-x`,
      `-z`,
      `--strip-components=1`,
      `-f`,
      pathToArchive,
      `-C`,
      execEnv.buildDir,
    ],
    {
      stdio: `inherit`,
    }
  );
}, 3000);
