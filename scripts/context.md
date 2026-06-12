# scripts/ — Build, packaging, and installer scripts

## release.js

Production release pipeline. Run with `npm run release`.

**Steps:**
1. Deletes `build/` and runs `npm run build:prod`
2. Copies `installer.nsh` into `build/`
3. Runs `ow-electron-builder --publish=never` with `process.env` forwarded so `azureSignOptions` receives Azure credentials

**Artifacts signed (by ow-electron-builder, in order):**
1. Main app exe (`win-unpacked/aimii.app.exe`)
2. NSIS uninstaller stub — signed *before* it's embedded (prevents "Old-uninstaller.exe is not signed" on upgrades)
3. Final NSIS installer exe

**Credentials (pick one):**
- `.env` — `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (service principal)
- `az login` — active session; Trusted Signing uses that identity

**Non-secret config:** `build.win.azureSignOptions` in `package.json` (endpoint, account name, profile name).

**Azure setup (once):**
1. `winget install -e --id Microsoft.Azure.ArtifactSigningClientTools`
2. Grant your user/app **Artifact Signing Certificate Profile Signer** on the account/profile (`aimii-signer → aimiiCodeSign`)
3. `package.json → build.win.azureSignOptions.endpoint` must match your account region (e.g. `wus` for West US)

## package-local.js

Local packaging without signing — for testing the installer flow. Run with `npm run installer`.

Same steps as `release.js` but strips `azureSignOptions` before invoking `ow-electron-builder`. Produces an unsigned `.exe` in `build/`.

## installer.nsh

Custom NSIS script included by electron-builder via `build.nsis.include` in `package.json`.
Copied into `build/` by `release.js` / `package-local.js` at build time — not committed to `build/`.

**Macros:**

### `customInit`
Runs at installer startup. Initialises region/consent variables and sets the install directory
to `$PROGRAMFILES64\aimii.app`.

### `customUnInstall`
Runs during uninstall. Guarded with `${ifNot} ${isUpdated}` so cleanup only fires on a
genuine user uninstall — **not** during an auto-update (electron-updater runs the old
uninstaller silently as part of applying an update; without this guard it would wipe the
user's settings on every update). Cleans up:
- `%APPDATA%\aimii.app` — Electron userData (settings, logs, cache)
- `%LOCALAPPDATA%\aimii.app-updater` — updater cache
- `HKCU\Software\aimii` — registry key
- `$INSTDIR` — install directory (`RMDir /r /REBOOTOK` + `SetRebootFlag false`)

**Tested:** local E2E update via `generic` provider → localhost feed confirmed that
`%APPDATA%\aimii.app\aimii-settings.json` survives an auto-update with this guard in place.

### `customInit`
Sets the install directory to `$PROGRAMFILES64\aimii.app`.

**perMachine note:** because the app installs to Program Files, `electron-updater` must
run the NSIS installer elevated (UAC prompt) on every auto-update. This is expected but
creates friction — each update requires the user to accept UAC. The Overwolf Installer
(per-user, no UAC) eliminates this when adopted.
