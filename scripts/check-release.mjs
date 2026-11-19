// Blocks `pnpm release` unless it runs from a clean, up-to-date main.
import { execSync } from "node:child_process";

const git = (cmd) => execSync(`git ${cmd}`, { encoding: "utf8" }).trim();
const fail = (msg) => {
  console.error(`\n✖ Release blocked: ${msg}\n`);
  process.exit(1);
};

const branch = git("rev-parse --abbrev-ref HEAD");
if (branch !== "main") {
  fail(`you're on "${branch}". Merge your PR and switch to main first.`);
}

if (git("status --porcelain")) {
  fail("you have uncommitted changes. Commit or stash them first.");
}

git("fetch origin main --quiet");
if (git("rev-parse HEAD") !== git("rev-parse origin/main")) {
  fail("your main differs from origin/main. Run `git pull` (and push any local commits through a PR).");
}

console.log("✔ Release check passed: clean main, in sync with origin.");
