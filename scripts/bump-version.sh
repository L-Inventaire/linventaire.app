#!/bin/bash

# Bump the app version everywhere it is stored:
#  - every package.json of the repo that has a "version" field
#  - frontend/src/config/environment.ts(.dist|.prod)
#
# Usage:
#   ./scripts/bump-version.sh           # patch: 1.2.4 -> 1.2.5
#   ./scripts/bump-version.sh minor     # 1.2.4 -> 1.3.0
#   ./scripts/bump-version.sh major     # 1.2.4 -> 2.0.0
#   ./scripts/bump-version.sh 1.4.2     # explicit version

set -e

cd "$(dirname "$0")/.."

node - "${1:-patch}" <<'EOF'
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const bump = process.argv[2];

// Current version, backend/package.json is the reference (see pre-commit hook)
const current = require(path.resolve("backend/package.json")).version;
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
if (!match) {
  console.error(`❌ Unsupported current version: ${current}`);
  process.exit(1);
}
let [major, minor, patch] = match.slice(1).map(Number);

let next;
if (bump === "major") next = `${major + 1}.0.0`;
else if (bump === "minor") next = `${major}.${minor + 1}.0`;
else if (bump === "patch") next = `${major}.${minor}.${patch + 1}`;
else if (/^\d+\.\d+\.\d+$/.test(bump)) next = bump;
else {
  console.error(`❌ Usage: bump-version.sh [patch|minor|major|X.Y.Z]`);
  process.exit(1);
}

// Tracked package.json files (skips node_modules and untracked files)
const packageFiles = execSync("git ls-files '*package.json'", {
  encoding: "utf-8",
})
  .split("\n")
  .filter(Boolean);

const envFiles = [
  "frontend/src/config/environment.ts",
  "frontend/src/config/environment.ts.dist",
  "frontend/src/config/environment.ts.prod",
].filter((f) => fs.existsSync(f));

// Only replace the first (top level) occurrence to keep the file formatting
const replaceIn = (file, regex, replacement) => {
  const content = fs.readFileSync(file, "utf-8");
  if (!regex.test(content)) return false;
  fs.writeFileSync(file, content.replace(regex, replacement));
  return true;
};

for (const file of packageFiles) {
  if (require(path.resolve(file)).version === undefined) continue;
  if (replaceIn(file, /"version":\s*"[^"]*"/, `"version": "${next}"`))
    console.log(`  ${file}`);
}
for (const file of envFiles) {
  if (replaceIn(file, /version:\s*"[^"]*"/, `version: "${next}"`))
    console.log(`  ${file}`);
}

console.log(`✅ Version bumped: ${current} -> ${next}`);
EOF
