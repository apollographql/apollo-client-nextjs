/*
This folder needs a special React version, and if we would just add a `workspace:*`
dependency on the `@apollo/client-react-streaming` package, it would be installed
with a symlink, pulling in the `node_modules` folder from that package's folder.

As a result, we'd end up with two incompatible versions of `react` being used at the
same time.

Instead, we use the `exec:` protocol (https://yarnpkg.com/protocol/exec) to build
the package and install the bundled artefact into the `node_modules` folder of the 
current package.
*/

const { execFileSync } = require("node:child_process");
const { join } = require("node:path");

const pathToArchive = join(execEnv.tempDir, "archive.tgz");
execFileSync(
  `yarn`,
  [
    `workspace`,
    `@apollo/client-react-streaming`,
    `pack`,
    `--out`,
    pathToArchive,
  ],
  {
    stdio: `inherit`,
    cwd: process.env.INIT_CWD,
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
