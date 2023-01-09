import fs from 'fs';
import { ElectronApplication, Page, _electron as electron } from 'playwright';

export async function electronStartup(): Promise<ElectronApplication> {
  // Delete config.json to have the same initial setup every run
  const path = process.env.ELECTRON_CONFIG_PATH as string;
  fs.unlink(`${path}/config.json`, (err) => {
    if (err) {
      console.error('there was an error:', err.message);
    } else {
      console.log(`${process.env.ELECTRON_CONFIG_PATH} was deleted`);
    }
  });
  const regex = /mmd-desktop-ui.*/u;
  try {
    fs.readdirSync(path)
      .filter((f) => regex.test(f))
      .map((f) => fs.unlinkSync(path + f));
  } catch (e: any) {
    console.log(e.message);
  }

  const electronApp = await createElectronApp();
  setupLogs(electronApp);

  await new Promise<void>((resolve) => {
    electronApp.process().stdout?.on('data', (data) => {
      if (data.includes('MetaMask initialization complete.')) {
        resolve();
      }
    });
  });

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

export async function getDesktopWindowByName(
  electronApp: ElectronApplication,
  windowName: string,
): Promise<Page> {
  // Finding the window like this as innerText seems not working as expected.
  const windows = electronApp.windows();
  const windowTitles = await Promise.all(windows.map((x) => x.title()));
  const windowIndex = windowTitles.findIndex((x) => x === windowName);
  const matchWindow = windows[windowIndex];
  console.log(`${windowName} title: ${await matchWindow.title()}`);
  return matchWindow;
}
