# Code signing (Azure Trusted Signing)

**One command:** `npm run release` — builds, then lets ow-electron-builder sign all artifacts via its built-in `azureSignOptions` integration.

**Artifacts signed (in order by ow-electron-builder):**
1. Main app exe (`win-unpacked/aimii.app.exe`)
2. NSIS uninstaller stub — signed *before* it's embedded in the installer (this is what prevents the "Old-uninstaller.exe is not signed" warning on future upgrades)
3. Final NSIS installer exe

**Credentials (pick one):**
- **.env** — `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (service principal)
- **az login** — sign in first; Trusted Signing will use that identity

**Non-secret config:** `build.win.azureSignOptions` in `package.json` (endpoint, account name, profile name).

**Setup once:**
1. Azure Artifact Signing Client: `winget install -e --id Microsoft.Azure.ArtifactSigningClientTools`
2. In Azure: give your user or app **Artifact Signing Certificate Profile Signer** on the account/profile (aimii-signer → aimiiCodeSign)
3. Endpoint in `package.json → build.win.azureSignOptions.endpoint` must match your account region (e.g. **wus** for West US)

**How it works:** `release.js` loads `.env` into `process.env`, then runs `ow-electron-builder` with `env: process.env` so the builder's Azure signing step receives the credentials. ow-electron-builder handles the full signing sequence including the uninstaller stub.
