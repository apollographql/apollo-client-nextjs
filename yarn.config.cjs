// @ts-check
/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require("@yarnpkg/types");

module.exports = defineConfig({
  async constraints({ Yarn }) {
    const packagesWithFixedPeers = {
      "@apollo/client": [
        "graphql",
        "react",
        "react-dom",
        "@types/react",
        "@types/react-dom",
      ],
    };

    for (const [ident, peers] of Object.entries(packagesWithFixedPeers)) {
      for (const dep of Yarn.dependencies({ ident })) {
        for (const peer of peers) {
          if (
            dep.workspace.manifest.dependencies?.[peer] ||
            dep.workspace.manifest.devDependencies?.[peer] ||
            dep.workspace.manifest.peerDependencies?.[peer]
          ) {
            continue;
          }
          dep.workspace.set(["devDependencies", peer], "*");
        }
      }
    }
  },
});
