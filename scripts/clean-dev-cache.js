/**
 * Remove webpack / Next dev caches that often corrupt on Windows (ENOENT on
 * PackFileCacheStrategy rename, missing page.js / routes-manifest.json).
 */
const fs = require("fs");
const path = require("path");

const targets = [".next/dev/cache", ".next/cache/webpack"];

for (const rel of targets) {
  const abs = path.join(process.cwd(), rel);
  if (!fs.existsSync(abs)) continue;
  fs.rmSync(abs, { recursive: true, force: true });
  console.log(`[clean-dev-cache] removed ${rel}`);
}
