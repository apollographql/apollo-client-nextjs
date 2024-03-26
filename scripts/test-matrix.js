const { execFileSync } = require("node:child_process");
const semver = require("semver");

const tags = execFileSync("npm", ["dist-tag", "ls", "@apollo/client"], {
  encoding: "utf-8",
}).toString();

// @ts-ignore
let latest = tags.match(/latest: (.*)/)[1];
// @ts-ignore
let next = tags.match(/next: (.*)/)[1];

if (semver.gt(next, latest)) {
  console.log('matrix=["next","latest"]');
} else {
  console.log('matrix=["latest"]');
}
