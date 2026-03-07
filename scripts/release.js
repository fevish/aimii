/**
 * Build then sign with Azure Trusted Signing.
 * Credentials: set AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET in .env, or use az login.
 * Run: npm run release
 */
const path = require('path');
const fs = require('fs');
const { execSync, spawnSync } = require('child_process');

const root = path.join(__dirname, '..');

// Load .env (optional; if using az login only, skip)
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([^#][^=]*)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const build = pkg.build;
const productName = build.productName || pkg.name.replace(/\./g, '-');
const version = pkg.version;
const azure = build.win?.azureSignOptions;

if (!azure) {
  console.error('package.json build.win.azureSignOptions is required.');
  process.exit(1);
}

const buildDir = path.join(root, 'build');

// 1. Build (no sign — builder’s sign step doesn’t receive our env)
const noSign = JSON.parse(JSON.stringify(build));
delete noSign.win.azureSignOptions;
const configPath = path.join(root, 'builder-config-no-sign.json');

if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true, force: true });
execSync('npm run build:prod', { cwd: root, stdio: 'inherit' });
fs.mkdirSync(buildDir, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'installer.nsh'), path.join(buildDir, 'installer.nsh'));
fs.writeFileSync(configPath, JSON.stringify(noSign, null, 2));
execSync(`npx ow-electron-builder --publish=never --config "${configPath}"`, { cwd: root, stdio: 'inherit' });
fs.unlinkSync(configPath);

// 2. Sign (we pass process.env so .env or az login is used)
const mainExe = path.join(buildDir, 'win-unpacked', `${productName}.exe`);
const installerExe = path.join(buildDir, `${productName}-${version}.exe`);
const toSign = [mainExe, installerExe].filter((p) => fs.existsSync(p));

if (toSign.length === 0) {
  console.error('No built exes to sign.');
  process.exit(1);
}

const endpoint = azure.endpoint || 'https://wus.codesigning.azure.net';
const account = azure.codeSigningAccountName;
const profile = azure.certificateProfileName;

for (const file of toSign) {
  const ps = `Invoke-TrustedSigning -Endpoint "${endpoint}" -CertificateProfileName "${profile}" -CodeSigningAccountName "${account}" -TimestampRfc3161 "http://timestamp.acs.microsoft.com" -TimestampDigest SHA256 -FileDigest SHA256 -Files "${file.replace(/"/g, '""')}"`;
  const r = spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', ps], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log('Done.', installerExe);
