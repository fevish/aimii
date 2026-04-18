/**
 * Build and sign with Azure Trusted Signing.
 * ow-electron-builder handles all signing via azureSignOptions (main exe, NSIS
 * uninstaller stub, and final installer). Credentials must be in process.env —
 * loaded here from .env, or available via az login.
 *
 * Run: npm run release
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');

// Load .env so ow-electron-builder's Azure signing receives credentials.
// Handles: quoted values, export prefix, CRLF line endings.
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.replace(/^\s*export\s+/, '').match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

const required = ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing Azure credentials: ${missing.join(', ')}`);
  console.error('.env file found:', fs.existsSync(envPath));
  process.exit(1);
}

const buildDir = path.join(root, 'build');

if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true, force: true });
execSync('npm run build:prod', { cwd: root, stdio: 'inherit' });
fs.mkdirSync(buildDir, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'installer.nsh'), path.join(buildDir, 'installer.nsh'));

// Pass process.env explicitly so ow-electron-builder's signing step receives Azure credentials
execSync('npx ow-electron-builder --publish=never', { cwd: root, stdio: 'inherit', env: process.env });

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const productName = pkg.build.productName || pkg.name;
console.log('Done.', path.join(buildDir, `${productName}-${pkg.version}.exe`));
