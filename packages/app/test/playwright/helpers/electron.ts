import fs from 'fs';
import { ElectronApplication, _electron as electron } from 'playwright';

export async function electronStartup(): Promise<ElectronApplication> {
  // Delete config.json to have the same initial setup every run
  fs.unlink(process.env.ELECTRON_CONFIG_PATH as string, (err) => {
    if (err) {
      console.error('there was an error:', err.message);
    } else {
      console.log(`${process.env.ELECTRON_CONFIG_PATH} was deleted`);
    }
  });
  const electronApp = await createElectronApp();
  setupLogs(electronApp);
  return electronApp;
}

export async function createElectronApp() {
  const electronApp = await electron.launch({
    args: [process.env.ELECTRON_APP_PATH as string],
  });
  return electronApp;
}

export function setupLogs(electronApp: ElectronApplication) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  electronApp
    .process()
    .stdout!.on('data', (data) => console.log(`stdout: ${data}`));

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  electronApp
    .process()
    .stderr!.on(
      'data',
      (error) =>
        console.log`stderr: ${Buffer.from(error, 'utf-8').toString('utf-8')}`,
    );
}
