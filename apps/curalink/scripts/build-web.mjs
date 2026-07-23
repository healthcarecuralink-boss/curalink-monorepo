#!/usr/bin/env node
// Assembles the Netlify publish directory for curalink.co.in.
//
// Two things ship from one deploy:
//   dist/          -- the marketing site (web/), served at /
//   dist/app/      -- the Expo web bundle, served at /app
//
// They are built separately because only the app half goes through Metro. The
// marketing page is hand-written HTML that we copy verbatim; running it through
// a bundler would gain nothing and risk mangling its inlined base64 assets.

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(appRoot, "dist");
const siteSrc = join(appRoot, "web");

// Start clean. A stale dist is worse than no dist: Expo hashes bundle
// filenames, so leftovers from a previous build are invisible to the new
// index.html but still get uploaded and served.
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// `expo export` writes the app straight into its /app subdirectory. The
// matching `experiments.baseUrl` in app.json is what makes the emitted asset
// URLs absolute against /app -- the two must stay in sync or the shell will
// request its bundle from the domain root and 404.
console.log("→ exporting Expo web bundle to dist/app");
execFileSync("npx", ["expo", "export", "--platform", "web", "--output-dir", "dist/app"], {
  cwd: appRoot,
  stdio: "inherit",
});

if (!existsSync(join(dist, "app", "index.html"))) {
  throw new Error("expo export finished but dist/app/index.html is missing -- aborting rather than publishing a broken site");
}

// The marketing site and the Netlify control files (_redirects, _headers,
// robots.txt) sit at the publish root, so they land on top of dist/ rather
// than inside dist/app.
console.log("→ copying marketing site + Netlify config to dist/");
for (const entry of readdirSync(siteSrc)) {
  cpSync(join(siteSrc, entry), join(dist, entry), { recursive: true });
}

for (const required of ["index.html", "_redirects", "_headers"]) {
  if (!existsSync(join(dist, required))) {
    throw new Error(`dist/${required} is missing -- check apps/curalink/web/`);
  }
}

console.log("✓ dist/ ready to publish (site at /, app at /app)");
