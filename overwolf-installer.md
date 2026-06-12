# Overwolf Installer — Readiness Checklist

Tracks the remaining code changes needed to ship aimii with the Overwolf custom installer
and its hosted update feed. DevRel contact and asset submission already done.

---

## Waiting on DevRel

- [x] Receive **`app_id`** from DevRel / Dev Console — `eaimfappicclanhddiknkddnkhbofnjpnnhigonm`.
- [ ] Confirm what the OW uninstaller cleans up (see note at bottom).

---

## Code changes (do once app_id is in hand)

### 1. Wire the Overwolf update feed — `package.json` ✅ Done

Added a `publish` block inside `build`:

```json
"publish": {
  "provider": "generic",
  "url": "https://electron-updates.overwolf.com/electron-updates/electron/<APP_ID>"
}
```

This is what electron-builder embeds as `app-update.yml` inside the packaged app.
`electron-updater` reads it at runtime to know where to poll for updates.
`release.js` stays as `--publish=never` — builds are uploaded to the Dev Console manually.

### 2. Switch to per-user install — `package.json` ✅ Done

Change in `build.nsis`:

```json
"perMachine": false
```

OW Installer is per-user (no UAC). The custom NSIS installer (kept for direct-download
fallback) should match so auto-updates are also UAC-free. Currently `true` which requires
elevation on every update.

### 3. Remove dev fake-mode — `src/browser/services/updater.service.ts` ✅ Done

Remove the three helpers only used for local testing:
- `fakeMode` getter (line ~48)
- `runFakeCheck()` method
- `runFakeDownload()` method

And revert the guards in `checkForUpdates`, `downloadUpdate`, and `quitAndInstall` back to
a simple no-op log when `!isSupported()`.

---

## Distribution URLs

Two distinct Overwolf URLs — don't confuse them:

- **Update feed** (in `package.json` `build.publish`, embedded in the app) —
  `https://electron-updates.overwolf.com/electron-updates/electron/eaimfappicclanhddiknkddnkhbofnjpnnhigonm`
  Where installed apps poll for new versions. Not user-facing.
- **Custom installer** (public download — website button, Discord, etc.) —
  `https://download.overwolf.com/install/Download?ExtensionId=eaimfappicclanhddiknkddnkhbofnjpnnhigonm`
  Where new users download the OW-managed installer for first install.

---

## Release workflow (after go-live)

1. `npm run release` — builds, signs (Azure Trusted Signing), outputs to `build/`
2. Upload `build/aimii.app-<version>.exe` + `build/latest.yml` + `build/*.blockmap`
   to the Dev Console (Testing channel first, then promote to Production)
3. Installed apps poll the OW CDN feed and surface the update via the in-app modal

---

## Note: uninstall cleanup

The custom `installer.nsh` `customUnInstall` macro (appdata, registry, INSTDIR cleanup) is
part of the NSIS build and does **not** carry over to the OW Installer. Confirm with DevRel:

- Does the OW uninstaller remove `%APPDATA%\aimii.app` (Electron userData / settings)?
- Does it remove `HKCU\Software\aimii` (registry key)?
- Can a custom uninstall hook be provided if not?

If OW doesn't handle these, a post-uninstall cleanup script may be needed.
