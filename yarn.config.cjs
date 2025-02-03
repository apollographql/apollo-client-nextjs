// @ts-check
/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require("@yarnpkg/types");
const { Configuration, Project } = require("@yarnpkg/core");
const { getPluginConfiguration } = require("@yarnpkg/cli");

module.exports = defineConfig({
  async constraints({ Yarn }) {
    const config = await Configuration.find(
      __dirname,
      getPluginConfiguration()
    );
    const { project } = await Project.find(config, __dirname);
    await project.restoreInstallState();

    function getCandidates(/** @type string */ ident) {
      const [scope, name] = ident.startsWith("@")
        ? ident.substring(1).split("/")
        : [null, ident];
      return Object.fromEntries(
        Array.from(project.storedPackages.values())
          .filter(
            (pkg) =>
              pkg.scope == scope &&
              pkg.name == name &&
              pkg.reference.startsWith(`virtual:`)
          )
          .map((pkg) => [
            pkg.reference.replace(/^virtual:/, "").substring(0, 5),
            pkg,
          ])
      );
    }

    const packagesWithFixedPeers = {
      "@apollo/client": [
        "graphql",
        "react",
        "react-dom",
        "@types/react",
        "@types/react-dom",
      ],
      react: ["react-dom", "@types/react", "@types/react-dom"],
    };
    const shouldBeUnique = new Set([
      "@apollo/client",
      "graphql",
      "react",
      "react-dom",
      "@types/react",
      "@types/react-dom",
    ]);

    for (const [ident, peers] of Object.entries(packagesWithFixedPeers)) {
      const deps = Yarn.dependencies({ ident });
      for (const dep of deps) {
        for (const peer of peers) {
          if (
            dep.workspace.manifest.dependencies?.[peer] ||
            dep.workspace.manifest.devDependencies?.[peer]
          ) {
            continue;
          }
          dep.workspace.set(["devDependencies", peer], "*");
          shouldBeUnique.delete(ident);
        }
      }
    }
    for (const ident of Array.from(shouldBeUnique.values())) {
      if (Object.keys(getCandidates(ident)).length > 1) {
        console.log(getCandidates(ident));
        Yarn.dependency({ ident }).workspace?.error(`
                The package ${ident} has multiple versions installed, which will cause problems. 
                This could not be autofixed, so you need to manually fix it.
                Run this command to see how these installations differ from each other and fix them:
    
                    yarn info -AR --dependents --virtuals ${ident}
            `);
        process.exitCode = 1;
      }
    }
  },
});
