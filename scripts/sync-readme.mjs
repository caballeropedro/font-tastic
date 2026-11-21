// Copies the root README.md into each published package, so npm shows the same README as GitHub.
// Relative paths are rewritten to absolute GitHub URLs, because they don't resolve on npmjs.com.
import { readFileSync, writeFileSync } from 'node:fs';

const REPO = 'caballeropedro/font-tastic';
const RAW = `https://raw.githubusercontent.com/${REPO}/main/`;
const TREE = `https://github.com/${REPO}/tree/main/`;
const PACKAGES = ['packages/core', 'packages/devtool'];

const source = readFileSync('README.md', 'utf8');

const readme = source
  // Images: <img src="./x"> and ![alt](./x)
  .replace(/src="\.\/([^"]+)"/g, (_m, path) => `src="${RAW}${path}"`)
  .replace(/!\[([^\]]*)\]\(\.\/([^)]+)\)/g, (_m, alt, path) => `![${alt}](${RAW}${path})`)
  // Links: [text](./x) and href="./x"
  .replace(/\]\(\.\/([^)]*)\)/g, (_m, path) => `](${TREE}${path})`)
  .replace(/href="\.\/([^"]*)"/g, (_m, path) => `href="${TREE}${path}"`);

const header = '<!-- Generated from the root README.md by scripts/sync-readme.mjs. Edit that file instead. -->\n\n';

for (const dir of PACKAGES) {
  writeFileSync(`${dir}/README.md`, header + readme);
}
console.log(`✔ README synced to ${PACKAGES.join(', ')}`);
