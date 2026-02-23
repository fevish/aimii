# Code signing (Azure Trusted Signing)

**One command:** `npm run release` — builds (no sign), then signs the main exe and the NSIS installer with Invoke-TrustedSigning.

**Credentials (pick one):**
- **.env** — `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (service principal)
- **az login** — sign in first; Trusted Signing will use that identity

**Setup once:**
1. Azure Artifact Signing Client: `winget install -e --id Microsoft.Azure.ArtifactSigningClientTools`
2. In Azure: give your user or app **Artifact Signing Certificate Profile Signer** on the account/profile (aimii-signer → aimiiCodeSign)
3. Endpoint in package.json must match your account region (e.g. **wus** for West US)

**Why build then sign in script:** The builder runs PowerShell for signing but does not pass your env to it, so signing would fail. The script builds without the builder’s sign step, then runs Invoke-TrustedSigning with your env (`.env` or `az login`).
