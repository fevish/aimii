/**
 * Runs the app with ow-electron in dev mode, with .env loaded so the gaming
 * packages (GEP, Overlay) can authenticate. Dev mode needs either OW_DEV_KEY,
 * or OW_CLI_EMAIL + OW_CLI_API_KEY. Without them the app runs but the packages don't load.
 *
 * Run: npm start (arguments are passed through to ow-electron)
 */
const { loadEnv } = require('./load-env');

loadEnv();

const hasConsoleCreds = process.env.OW_CLI_EMAIL && process.env.OW_CLI_API_KEY;
if (!hasConsoleCreds && !process.env.OW_DEV_KEY) {
  console.warn('No Overwolf dev credentials found (OW_CLI_EMAIL + OW_CLI_API_KEY, or OW_DEV_KEY).');
  console.warn('The app will start, but GEP and Overlay will not load.');
}

require('@overwolf/ow-electron/cli.js');
