/**
 * Build and sign a release. ow-electron-builder applies both signatures:
 * - Overwolf package signing via OW_CLI_EMAIL, OW_CLI_API_KEY and OW_BUILD_KEY
 * - exe signing with Azure Trusted Signing via azureSignOptions (main exe, NSIS
 *   uninstaller stub, and final installer)
 * GEP and Overlay only load in builds that carry both.
 * Credentials must be in process.env — loaded here from .env, or available via az login.
 *
 * Run: npm run release
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { loadEnv } = require('./load-env');

const root = path.join(__dirname, '..');

const envFound = loadEnv();

const required = [
  'AZURE_TENANT_ID',
  'AZURE_CLIENT_ID',
  'AZURE_CLIENT_SECRET',
  'OW_CLI_EMAIL',
  'OW_CLI_API_KEY',
  'OW_BUILD_KEY',
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing signing credentials: ${missing.join(', ')}`);
  console.error('.env file found:', envFound);
  process.exit(1);
}

const buildDir = path.join(root, 'build');

if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true, force: true });
execSync('npm run build:prod', { cwd: root, stdio: 'inherit' });
fs.mkdirSync(buildDir, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'installer.nsh'), path.join(buildDir, 'installer.nsh'));

// Pass process.env explicitly so ow-electron-builder's signing steps receive the credentials
execSync('npx ow-electron-builder --publish=never', { cwd: root, stdio: 'inherit', env: process.env });

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const productName = pkg.build.productName || pkg.name;
console.log('Done.', path.join(buildDir, `${productName}-${pkg.version}.exe`));
