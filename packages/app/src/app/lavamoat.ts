import './globals';
import path from 'path';
import { app } from 'electron';
import { runLava } from 'lavamoat';
import * as Sentry from '@sentry/electron/main';
import { getDesktopVersion } from '../utils/version';
import { getSentryDefaultOptions } from './renderer/setup-sentry';

const release = getDesktopVersion();
// Init Sentry in the main process before lavamoat
const sentryOptions = getSentryDefaultOptions(release);
if (sentryOptions) {
  Sentry.init({ ...sentryOptions, ipcMode: Sentry.IPCMode.Both, release });
}

// TODO Remove this whenever we solve the issue with domain builtin
process.env.LOCKDOWN_DOMAIN_TAMING = 'unsafe';

let appPath = process.cwd();
const policyRelativePath = '/lavamoat/node/';

if (app.isPackaged) {
  appPath = app.getAppPath();
}

const entryPath = path.join(appPath, '/dist/app/src/app/main.js');

const policyPath = path.join(appPath, policyRelativePath, 'policy.json');
const policyOverridePath = path.join(
  appPath,
  policyRelativePath,
  'policy-override.json',
);
runLava({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  entryPath,
  policyPath,
  policyOverridePath,
  projectRoot: appPath,
  includeDevDeps: false,
}).catch((err: Error) => {
  // explicity log stack to workaround https://github.com/endojs/endo/issues/944
  console.error(err.stack || err);
  process.exit(1);
});
