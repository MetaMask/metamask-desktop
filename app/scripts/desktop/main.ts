import path from 'path';
import { app } from 'electron';
import { runLava } from 'lavamoat';

let appPath = process.cwd();
let policyRelativePath = '/lavamoat/node/';

if (app.isPackaged) {
  appPath = app.getAppPath();
  policyRelativePath = '/lavamoat/electron/';
}

const entryPath = path.join(appPath, '/dist_desktop/app/scripts/background.js');
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
  isPackagedApp: app.isPackaged,
}).catch((err: Error) => {
  // explicity log stack to workaround https://github.com/endojs/endo/issues/944
  console.error(err.stack || err);
  process.exit(1);
});
