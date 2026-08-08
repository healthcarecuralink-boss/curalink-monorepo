# Deploying the web apps

Two Netlify sites, one repo. Each domain serves the marketing page at `/` and
the Expo app as a single-page bundle at `/app`.

| Domain               | App directory       | Publish directory       |
| -------------------- | ------------------- | ----------------------- |
| `curalink.co.in`     | `apps/curalink`     | `apps/curalink/dist`     |
| `curalinkplus.co.in` | `apps/curalink-plus` | `apps/curalink-plus/dist` |

## Build locally

```bash
pnpm build:web
```

Or one at a time:

```bash
pnpm build:web:curalink
```

Each build produces a complete publish directory:

```
dist/
  index.html        marketing site, served at /
  _redirects        SPA fallback for /app/*
  _headers          security + caching headers
  robots.txt
  app/              Expo web bundle, served at /app
    index.html      app shell (built from public/index.html)
    manifest.json   PWA manifest
    _expo/...       hashed JS bundle and assets
```

Check a production build before pushing it — the Expo dev server does not
exercise the `/app` base path, the SPA fallback, or the marketing page at `/`:

```bash
node scripts/serve-dist.mjs apps/curalink 4173
```

Then open <http://localhost:4173/> for the site and
<http://localhost:4173/app> for the app.

## Publishing

> **Pushing to GitHub does not deploy anything.** Neither Netlify site is
> connected to `healthcarecuralink-boss/curalink-monorepo`. Both were created as
> direct-upload sites: their Netlify "repo" is an internal `hgit.services-prod`
> URL, and neither has a build command. Netlify never builds this project — it
> only receives a `dist/` directory that you built locally. A `git push` alone
> will leave both domains serving the previous deploy indefinitely.

So publishing is always two steps: build locally, then upload each `dist/`.

```bash
pnpm build:web
```

```bash
netlify deploy --prod --no-build --dir=apps/curalink/dist --site=83e6bb84-a799-4ed2-b549-d14955a335e5
```

```bash
netlify deploy --prod --no-build --dir=apps/curalink-plus/dist --site=171aab0b-ad3c-467a-93ed-c4719e9f9e4e
```

| Domain               | Netlify site name             | Site ID                                |
| -------------------- | ----------------------------- | -------------------------------------- |
| `curalink.co.in`     | `splendorous-tulumba-502a4d`  | `83e6bb84-a799-4ed2-b549-d14955a335e5` |
| `curalinkplus.co.in` | `enchanting-capybara-2db625`  | `171aab0b-ad3c-467a-93ed-c4719e9f9e4e` |

Run the CLI from outside the repo (or pass `--dir` as an absolute path): from
the monorepo root it detects the pnpm workspace and stops to ask which project
you meant, which hangs a non-interactive shell. `--no-build` is what keeps it
from trying to infer a build for a directory that is already built.

Because the sites are not built by Netlify, `EXPO_PUBLIC_*` variables are read
from your **local** `.env` at build time, not from the Netlify UI — see below.

Routing and header rules live in `_redirects` / `_headers` inside each publish
directory, so there is no `netlify.toml` to conflict between the two sites.

Still worth doing when there is time: connect both sites to the GitHub repo
with the build commands `pnpm install --frozen-lockfile && pnpm
build:web:curalink` / `...:curalink-plus`, publish directory
`apps/<app>/dist`, base directory left blank (the repo root, so pnpm can
resolve `packages/api-client` and `packages/ui`), and `NODE_VERSION=20`. That
would make `main` the source of truth instead of whatever was last uploaded
from someone's laptop.

### Environment variables

Because `pnpm build:web` runs on your machine, these are read from the local
`.env` / `.env.local` in each app directory — **not** from the Netlify UI.
Setting them in Netlify has no effect while the sites are direct-upload. They
are inlined into the bundle at build time, so changing one means rebuilding and
re-uploading, not just restarting anything.

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_SENTRY_DSN
EXPO_PUBLIC_MSG91_WIDGET_ID
EXPO_PUBLIC_MSG91_WIDGET_AUTH_TOKEN
SENTRY_DISABLE_AUTO_UPLOAD
```

A corollary worth stating plainly: whoever deploys decides what ends up in the
bundle. If your `.env` is stale or missing a key, the build silently ships a
site pointing at the wrong backend. Check `pnpm lint` output — it prints the
env files it loaded and the variables it exported.

Anything prefixed `EXPO_PUBLIC_` is readable by anyone who opens the site.
That is fine for the Supabase anon key, which is designed to be public and
constrained by row-level security — but it means RLS is the only thing
protecting that data, so it must actually be enabled on every table.

### Domains

Point each domain at its Netlify site and let Netlify provision the TLS
certificate. Set the apex (`curalink.co.in`) as the primary domain and let
`www` redirect to it, or the reverse — just pick one, so the app is not served
from two origins. Two origins means two `localStorage` buckets, and a session
started on one is invisible to the other.

## After deploying

Worth confirming on the live domain:

- `/` serves the marketing page and the lead form still submits.
- `/app` loads the app, and a deep link like `/app/auth` returns the app
  shell with a 200 rather than a 404.
- `/app/manifest.json` resolves and the browser offers to install the app.
- The dev-only role-switch panel on the partner login screen is **absent** —
  it is `__DEV__`-gated and stripped from production bundles, but it grants
  unauthenticated role access, so it is worth eyeballing after the first deploy.

## Notes

- `experiments.baseUrl` in each `app.json` is `/app` and must stay in sync with
  where the build script writes the bundle. If they diverge, the shell requests
  its JS from the domain root and the app renders as a blank page.
- The app shell is built from `public/index.html`, not an Expo Router
  `+html.tsx` — `+html.tsx` only applies to the `static`/`server` output modes,
  and both apps use `web.output: "single"`.
- The marketing pages and the apps talk to the same Supabase project
  (`fsrbfgerimqbzdxspsrf`); lead capture lands in `public.leads`.
- Directory routes are served with a trailing slash (`/services/home-nursing/`),
  and Netlify 301s the slashless form onto it. Internal links, `rel=canonical`
  and `sitemap.xml` all use the trailing-slash form so no internal navigation
  pays for a redirect — keep new links in that shape.

## Known gaps

Nothing outstanding from the earlier list — all three previous gaps are closed:

- ~~Split Supabase projects.~~ Leads now go to `public.leads` in the same
  project the apps use (`20260724020000_marketing_leads.sql`). The table is
  insert-only for `anon` and readable only by `is_curalink_staff()`, so the
  public forms can submit but nobody can read the lead list back.
- ~~Both apps ship the same icon.~~ `apps/curalink` and `apps/curalink-plus`
  now ship distinct `icon.png`, and the generated `web/icon-*.png` differ.
- ~~No Open Graph image.~~ Both sites ship their own `web/og-image.png` and
  reference it from every page.

Worth keeping an eye on:

- **Accessible names are hand-maintained.** Every form control on both sites
  has either an `aria-label` or a `<label for=...>`; there is no automated
  check, so a newly added field can silently regress it.
- **`curalinkplus.co.in/` inlines its logos as base64 in the HTML.** That page
  is ~345 KB uncompressed (~113 KB brotli) and is served `must-revalidate`, so
  the logo bytes are re-fetched on every visit rather than cached. Moving them
  to files under `/assets/` would let the `/assets/*` rule cache them.
