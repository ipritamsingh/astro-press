/**
 * Remove the previous build output before a fresh build.
 *
 * `astro build` does not clean dist/. Removing a page or renaming a route
 * therefore leaves the old HTML behind, and because Cloudflare Pages deploys
 * whatever is in dist/, stale pages stay live on production.
 *
 * Uses only node:fs so no new dependency is required. The previous
 * `clean` script used `rm -rf`, which is not portable to Windows shells.
 */
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');

try {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('[clean] Removed previous dist/ output.');
  } else {
    console.log('[clean] No dist/ directory to remove.');
  }
} catch (err) {
  console.error('[clean] Failed to remove dist/:', err && err.message);
  process.exit(1);
}