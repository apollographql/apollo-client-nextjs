// @ts-check

/**
 * Compares actual exports of a package per condition with
 * the expected exports described by a package-shape.json file.
 */

import assert from "node:assert";
import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseArgs } from "node:util";

const args = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
});

for (const pkg of args.positionals) {
  console.log("Checking package.json: %s", pkg);
  await checkPackage(pkg);
}

async function checkPackage(/** @type {string} */ pkg) {
  const json = JSON.parse(await readFile(pkg, { encoding: "utf-8" }));
  for (const entryPoint of Object.keys(json)) {
    for (const [condition, shape] of Object.entries(json[entryPoint])) {
      shape.sort();
      await verifyESM(condition, entryPoint, pkg, shape);
      await verifyCJS(condition, entryPoint, pkg, shape);
    }
  }
}
/**
 *
 * @param {string} condition
 * @param {string} entryPoint
 * @param {string} pkg
 * @param {string[]} shape
 */
async function verifyESM(condition, entryPoint, pkg, shape) {
  const conditionFlags = condition
    .split(",")
    .map((c) => `--conditions ${c}`)
    .join(" ");
  console.log(`Checking ESM: ${entryPoint} with ${conditionFlags}`);
  const child = exec(
    `node --input-type=module ${conditionFlags} --eval 'console.log(JSON.stringify(Object.keys(await import("${entryPoint}"))))'`,
    {
      cwd: dirname(pkg),
    }
  );
  let result = "";
  child.stdout?.on("data", (data) => (result += data.toString()));
  child.stderr?.pipe(process.stderr);
  await new Promise((resolve) => child.on("exit", resolve));
  assert.deepStrictEqual(JSON.parse(result).sort(), shape.sort());
}

/**
 *
 * @param {string} condition
 * @param {string} entryPoint
 * @param {string} pkg
 * @param {string[]} shape
 */
async function verifyCJS(condition, entryPoint, pkg, shape) {
  const conditionFlags = condition
    .split(",")
    .map((c) => `--conditions ${c}`)
    .join(" ");
  console.log(`Checking CJS: ${entryPoint} with ${conditionFlags}`);
  const child = exec(
    `node --input-type=commonjs ${conditionFlags} --eval 'console.log(JSON.stringify(Object.keys(require("${entryPoint}"))))'`,
    {
      cwd: dirname(pkg),
    }
  );
  let result = "";
  child.stdout?.on("data", (data) => (result += data.toString()));
  child.stderr?.pipe(process.stderr);
  await new Promise((resolve) => child.on("exit", resolve));
  assert.deepStrictEqual(JSON.parse(result).sort(), shape);
}
