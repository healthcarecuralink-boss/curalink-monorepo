#!/usr/bin/env node
// Assembles the Netlify publish directory for curalink.co.in.
//
// The domain is the real CuraLink app (Expo web export) at the root, plus a
// handful of static SEO subpages (services/*, /hyderabad) and Netlify config
// copied on top from web/. There is no separate marketing shell anymore --
// index.web.tsx (see src/app/) IS the logged-out welcome screen, replacing
// the old hand-written web/index.html.

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

console.log("→ exporting Expo web bundle to dist/");
execFileSync("npx", ["expo", "export", "--platform", "web", "--output-dir", "dist"], {
  cwd: appRoot,
  stdio: "inherit",
});

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("expo export finished but dist/index.html is missing -- aborting rather than publishing a broken site");
}

// The static SEO subpages and Netlify control files (_redirects, _headers,
// robots.txt, sitemap.xml) sit at the publish root alongside the exported
// app -- Netlify serves these real files first, only falling through to the
// SPA shell for the app's own client-side routes (see _redirects).
console.log("→ copying static subpages + Netlify config to dist/");
for (const entry of readdirSync(siteSrc)) {
  cpSync(join(siteSrc, entry), join(dist, entry), { recursive: true });
}

for (const required of ["_redirects", "_headers"]) {
  if (!existsSync(join(dist, required))) {
    throw new Error(`dist/${required} is missing -- check apps/curalink/web/`);
  }
}

console.log("✓ dist/ ready to publish (the real app at /, static subpages alongside it)");
