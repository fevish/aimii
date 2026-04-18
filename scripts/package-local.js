/**
 * Build and package without signing — for local installer testing.
 * Run: npm run installer
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const buildDir = path.join(root, 'build');
const configPath = path.join(root, 'builder-config-no-sign.json');

// Strip signing so the local build doesn't attempt Azure signing
const noSign = JSON.parse(JSON.stringify(pkg.build));
delete noSign.win.azureSignOptions;

if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true, force: true });
execSync('npm run build:prod', { cwd: root, stdio: 'inherit' });
fs.mkdirSync(buildDir, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'installer.nsh'), path.join(buildDir, 'installer.nsh'));
fs.writeFileSync(configPath, JSON.stringify(noSign, null, 2));

try {
  execSync(`npx ow-electron-builder --publish=never --config "${configPath}"`, { cwd: root, stdio: 'inherit' });
} finally {
  fs.unlinkSync(configPath);
}
