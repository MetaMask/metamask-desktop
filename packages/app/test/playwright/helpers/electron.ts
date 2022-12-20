import fs from 'fs';
import { ElectronApplication, Page, _electron as electron } from 'playwright';

export async function electronStartup(env?: {
  [key: string]: string;
}): Promise<ElectronApplication> {
  // Delete config.json to have the same initial setup every run
  console.log('resetConfigFiles');
  await resetConfigFiles();
  console.log('createElectronApp');
  const electronApp = await createElectronApp(env);
  console.log('setupLogs');
  setupLogs(electronApp);
  return electronApp;
}

export async function resetConfigFiles() {
  const path = process.env.ELECTRON_CONFIG_PATH as string;
  fs.unlink(`${path}/config.json`, (err) => {
    if (err) {
      console.log('File not found:', err.message);
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
}

export async function createElectronApp(env?: { [key: string]: string }) {
  console.log(env);
  console.log('electron.launch start');
  const electronApp = await electron.launch({
    args: [process.env.ELECTRON_APP_PATH as string],
    env,
  });
  console.log('electron.launch finish');
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
