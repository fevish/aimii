/**
 * Loads KEY=value pairs from the project's .env into process.env.
 * Handles: quoted values, export prefix, CRLF line endings.
 */
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env');

function loadEnv() {
  if (!fs.existsSync(envPath)) return false;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.replace(/^\s*export\s+/, '').match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return true;
}

module.exports = { loadEnv, envPath };
