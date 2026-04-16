# scripts/ — Build, packaging, and installer scripts

## package-local.js

Local packaging without signing — for testing the installer flow. Run with `npm run installer`.

Does the same build + package steps as `release.js` (strips `azureSignOptions`, copies `installer.nsh`, runs `ow-electron-builder`) but skips the `Invoke-TrustedSigning` step entirely. Produces an unsigned `.exe` in `build/`.

## release.js

The production release pipeline. Run with `npm run release`.

**Steps:**
1. Deletes `build/` and runs `npm run build:prod` (webpack, no signing)
2. Copies `installer.nsh` into `build/` so electron-builder can find it
3. Runs `ow-electron-builder` with a temporary config that has `azureSignOptions` stripped (builder can't pass env to its own sign step)
4. Signs three artifacts with `Invoke-TrustedSigning` (PowerShell):
   - `build/win-unpacked/${productName}.exe` — main app
   - `build/win-unpacked/Uninstall ${productName}.exe` — uninstaller (must be signed so future upgrades don't show an unsigned `Old-uninstaller.exe` warning)
   - `build/${productName}-${version}.exe` — NSIS installer

Signing credentials are read from `.env` (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`) or from an active `az login` session. See `docs/code-signing.md` for setup.

## installer.nsh

Custom NSIS script included by electron-builder via `build.nsis.include` in `package.json`.

**Macros:**

### `customInit`
Runs at installer startup. Initialises region/consent variables and sets the install directory to `$PROGRAMFILES\aimii` for all users (`SetShellVarContext all`).

### `customUnInstall`
Runs during uninstall. Cleans up files the NSIS default uninstall doesn't know about:
- `%APPDATA%\aimii.app` — Electron userData (settings, logs, cache)
- `HKCU\Software\aimii` — registry key written by the installer for region/consent

### `RegionSelectionPage` / `RegionToggle` / `RegionSelectionPageLeave`
Custom installer page that lets the user declare EU residency. Result is stored in `HKCU\Software\aimii\Privacy\Region` (`EU` or `OTHER`) and controls whether the GDPR consent page is shown.

### `ConsentPage` / `ConsentToggle` / `ConsentPageLeave`
GDPR consent page shown only when the user selects EU. The Next button is disabled until consent is given. Consent status and date are written to `HKCU\Software\aimii\Privacy`.

## How installer.nsh reaches the build

`release.js` copies `installer.nsh` into `build/` before invoking electron-builder. The `package.json` nsis config points at `build/installer.nsh`:

```json
"nsis": {
  "include": "build/installer.nsh"
}
```

The file is not committed to `build/` — it lives in `scripts/` and is copied fresh each build.
