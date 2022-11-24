import './globals';
import path from 'path';
import { app } from 'electron';
import { runLava } from 'lavamoat';

let appPath = process.cwd();
const policyRelativePath = '/lavamoat/node/';

if (app.isPackaged) {
  appPath = app.getAppPath();
}

const entryPath = path.join(
  appPath,
  '/dist/app/submodules/extension/app/scripts/background.js',
);

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
