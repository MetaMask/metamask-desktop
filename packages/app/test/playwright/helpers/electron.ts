import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { runInShell } from '../../../submodules/extension/development/lib/run-command';
import { ELECTRON_APP_PATH } from './constants';

export async function electronStartup(): Promise<ElectronApplication> {
  // Delete config.json to have the same initial setup every run
  console.log('resetConfigFiles');
  await resetConfigFiles();
  console.log('createElectronApp');
  const electronApp = await createElectronApp();
  console.log('setupLogs');
  setupLogs(electronApp);
  return electronApp;
}

export async function resetConfigFiles() {
  try {
    await runInShell('yarn', ['clear:electron-state'], undefined as any);
  } catch {
    // Ignore errors
  }
}

export async function createElectronApp() {
  console.log('electron.launch start');
  const electronApp = await electron.launch({
    args: [ELECTRON_APP_PATH],
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
