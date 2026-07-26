#!/usr/bin/env node
// Serves a built dist/ the way Netlify will, so a production build can be
// checked locally before it goes to a real domain. The Expo dev server does
// not exercise any of this: the SPA fallback for the app's client-side
// routes (/auth, /login, /(tabs)/home, ...) and the static subpages sitting
// alongside the app at the root are all deploy-time concerns.
//
//   node scripts/serve-dist.mjs apps/curalink 4173
//
// Deliberately minimal -- it implements the one rule in web/_redirects
// (unmatched paths fall back to the root index.html) and nothing else. It is
// a verification aid, not a production server.

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const appDir = resolve(process.argv[2] ?? "apps/curalink");
const port = Number(process.argv[3] ?? 4173);
const root = join(appDir, "dist");

if (!existsSync(root)) {
  console.error(`No build at ${root} -- run \`pnpm --filter <app> build:web\` first.`);
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function resolveFile(urlPath) {
  // normalize() collapses any ../ before it can escape the publish root.
  const rel = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  let candidate = join(root, rel);

  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    candidate = join(candidate, "index.html");
  }
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;

  // The SPA fallback from web/_redirects: any unmatched path is one of the
  // app's own client-side routes (/auth, /login, /(tabs)/home, ...), so hand
  // back the root shell with a 200. Real files (static subpages, the JS
  // bundle, icons) were already matched above, exactly as Netlify orders it.
  const shell = join(root, "index.html");
  if (existsSync(shell)) return shell;
  return null;
}

createServer((req, res) => {
  const urlPath = new URL(req.url, "http://localhost").pathname;
  const file = resolveFile(urlPath === "/" ? "/index.html" : urlPath);

  if (!file) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("404");
    return;
  }
  res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`Serving ${root}`);
  console.log(`  http://localhost:${port}/`);
});
