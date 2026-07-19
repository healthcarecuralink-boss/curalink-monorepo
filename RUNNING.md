# Running CuraLink locally

Steps to get `curalink` (and `curalink-plus`) running on an Android emulator after a fresh
`git clone`. Do the **one-time setup** once per machine, then **every time** for daily dev.

---

## Prerequisites (install once, machine-wide)

- **Node.js 20+**
- **pnpm**, via corepack: `corepack enable`
- **Java 21** (JDK)
- **Android Studio**, with:
  - An Android SDK installed (Settings → Languages & Frameworks → Android SDK)
  - At least one emulator created (Device Manager → Create Device)

⚠️ If Android Studio and a standalone SDK were ever installed separately, you can end up with
**two different SDK folders** on disk (e.g. one under `%LOCALAPPDATA%\Android\Sdk` and another
elsewhere). Only one of them will have the full `platforms/` + `build-tools/` needed to actually
build. Confirm which one is complete before setting env vars below — point everything at *that*
one.

---

## One-time setup (after cloning)

### 1. Install dependencies
From the repo root:
```bash
pnpm install
```

### 2. Get Supabase credentials
Ask whoever owns the Supabase project for (or find in **supabase.com → your project → Project
Settings → API**):
- **Project URL** — looks like `https://xxxxx.supabase.co` (use the base URL, not the
  `/rest/v1/...` path)
- **anon / public key** — long string starting with `eyJ...`

### 3. Create the env file(s)
Each app reads its own `.env.local` (this filename is git-ignored on purpose — never commit
real credentials):

`apps/curalink/.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

`apps/curalink-plus/.env.local` — same two values (same backend, same keys):
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Point your shell at the Android SDK
Every terminal you run Expo/Gradle commands from needs these set. PowerShell, per session:
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator;$env:Path"
```
(Adjust the path if your complete SDK lives somewhere else — see the prerequisites warning
above.) Verify with `adb version` — it should print a version, not an error.

To avoid repeating this every session, set `ANDROID_HOME` / `ANDROID_SDK_ROOT` as **permanent**
Windows user environment variables (System Properties → Environment Variables), and add
`%ANDROID_HOME%\platform-tools` + `%ANDROID_HOME%\emulator` to your permanent `PATH`.

---

## Every time you want to run it

### Option A — terminal (simplest)
1. Start the emulator (or plug in a real device):
   ```powershell
   emulator -avd <your-avd-name>
   ```
   (list available AVDs with `emulator -list-avds`)
2. From the app folder, build + install + launch (first run, or after native/config changes):
   ```bash
   cd apps/curalink
   npx expo run:android
   ```
   This also starts the Metro bundler for you. For `curalink-plus`, same command from
   `apps/curalink-plus`.
3. For everyday JS/TS edits after that first run, you don't need to rebuild — just leave Metro
   running (`npx expo start`) and the app updates live via Fast Refresh.

### Option B — Android Studio GUI (green ▶ button)
Android Studio's run button only works on the actual native Gradle project, which is a
**generated, git-ignored folder** — not the repo root.

1. **File → Open** → select `apps/curalink/android` specifically (not the repo root, not
   `apps/curalink`). Let Gradle sync.
   - If that folder doesn't exist yet, run `npx expo run:android` once from the terminal first —
     it generates it.
2. Pick your emulator in the device dropdown next to ▶ (start it via Device Manager if needed).
3. *(Optional)* **Settings → Tools → Emulator → "Launch in a tool window"** — docks the emulator
   inside the IDE instead of opening a separate window.
4. **Before hitting ▶**, start Metro so the app has JS to run — open Android Studio's own
   **Terminal** tab and run:
   ```bash
   npx expo start
   ```
   Leave it running.
5. Hit ▶. This builds/installs/launches the native shell; Metro serves the JS.

---

## Troubleshooting

**`Error: The system cannot find the path specified` / ENOENT on `npx expo run:android`**
`adb` (or another SDK tool) isn't on `PATH`, or `ANDROID_HOME`/`ANDROID_SDK_ROOT` points at the
wrong/incomplete SDK folder. Redo step 4 of one-time setup, confirm `adb version` works.

**`Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY`**
`.env.local` is missing or misnamed in the app folder you're running. Must be named exactly
`.env.local` (not `.env`) — see step 3.

**Android Studio shows "Add Configuration" instead of a run button**
You opened the wrong folder. It must be `apps/curalink/android` (or `apps/curalink-plus/android`)
specifically — see Option B, step 1.

**The `android/` (and `ios/`) folder isn't on GitHub**
Expected — it's auto-generated from `app.json` via `expo prebuild` (which `expo run:android`
calls automatically) and is git-ignored on purpose. Never hand-edit files in it; they don't
persist across a clean prebuild. Real app code lives in `src/`, which *is* tracked.

**Emulator opens in its own separate window instead of inside Android Studio**
Enable Settings → Tools → Emulator → "Launch in a tool window".
