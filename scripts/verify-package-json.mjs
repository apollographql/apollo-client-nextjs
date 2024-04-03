// @ts-check

/**
 * Verifies that all files referenced in package.json actually exist.
 */

import { readFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { parseArgs } from "node:util";

const args = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
});

let notfound = 0;
for (const pkg of args.positionals) {
  console.log("Checking package.json: %s", pkg);
  await checkPackage(pkg);
}
if (notfound > 0) {
  process.exit(1);
} else {
  console.log("All referenced files found.");
}

async function checkPackage(/** @type {string} */ pkg) {
  const json = JSON.parse(await readFile(pkg, { encoding: "utf-8" }));
  // handled by publint
  // await ensureLeafFilesExist(dirname(pkg), json.exports);
  await ensureLeafFilesExist(dirname(pkg), json.typesVersions);
  await ensureLeafFilesExist(dirname(pkg), json.types);
  await ensureLeafFilesExist(dirname(pkg), json.typings);
  // handled by publint
  // await ensureLeafFilesExist(dirname(pkg), json.main);
}

/**
 * @typedef {{[key :string]: string | string[] | FileMap}} FileMap
 */

async function ensureLeafFilesExist(
  /** @type {string} */ basedir,
  /** @type {FileMap | string | string[] | undefined} */ fileMap
) {
  if (!fileMap) return;
  if (typeof fileMap === "string") {
    try {
      await access(join(basedir, fileMap));
      // console.log("Found file: ", fileMap);
    } catch {
      notfound++;
      console.error("File not found: ", fileMap);
    }
    return;
  }
  for (const entry of Object.values(fileMap)) {
    ensureLeafFilesExist(basedir, entry);
  }
}
