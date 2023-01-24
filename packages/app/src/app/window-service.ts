import path from 'path';
import { app, BrowserWindow } from 'electron';
import log from 'loglevel';
import UIState from './ui-state';
import { titleBarOverlayOpts } from './ui-constants';
import { readPersistedSettingFromAppState } from './ui-storage';

export default class WindowService {
  private UIState: typeof UIState;

  constructor() {
    this.UIState = UIState;
  }

  public async createMainWindow() {
    const { wasOpenedAsHidden } = app.getLoginItemSettings();
    const mainWindow = new BrowserWindow({
      show: !wasOpenedAsHidden,
      width: 840,
      height: 680,
      minWidth: 800,
      minHeight: 640,
      titleBarStyle: 'hidden',
      titleBarOverlay: titleBarOverlayOpts.light,
      webPreferences: {
        preload: path.resolve(__dirname, './renderer/preload.js'),
      },
      icon: path.resolve(__dirname, '../../dist/app/icon.png'),
    });

    if (process.platform === 'win32') {
      // Keep this to prevent "alt" key is not triggering menu in Windows
      mainWindow?.setMenu(null);
    }

    const isMetametricsOptionSelected = readPersistedSettingFromAppState({
      defaultValue: false,
      key: 'isMetametricsOptionSelected',
    });

    const startupPage = isMetametricsOptionSelected
      ? 'pair'
      : 'metametrics-opt-in';

    mainWindow.loadFile(
      path.resolve(__dirname, '../../../ui/desktop-ui.html'),
      { hash: startupPage },
    );

    log.debug('Created main window');

    this.UIState.mainWindow = mainWindow;
  }

  public async createTrezorWindow() {
    const trezorWindow = new BrowserWindow({
      show: false,
      parent: this.UIState.mainWindow,
      webPreferences: {
        preload: path.resolve(
          __dirname,
          '../hw/trezor/renderer/trezor-preload.js',
        ),
      },
    });

    await trezorWindow.loadFile(
      path.resolve(__dirname, '../../html/desktop-trezor.html'),
    );

    trezorWindow.webContents.setWindowOpenHandler((details) => ({
      action: details.url.startsWith('https://connect.trezor.io/')
        ? 'allow'
        : 'deny',
    }));

    log.debug('Created trezor window');

    this.UIState.trezorWindow = trezorWindow;
  }

  public async createLatticeWindow() {
    const latticeWindow = new BrowserWindow({
      show: false,
      parent: this.UIState.mainWindow,
      webPreferences: {
        preload: path.resolve(
          __dirname,
          '../hw/lattice/renderer/lattice-preload.js',
        ),
      },
    });

    await latticeWindow.loadFile(
      path.resolve(__dirname, '../../html/desktop-lattice.html'),
    );

    latticeWindow.webContents.setWindowOpenHandler((details) => ({
      action: details.url.startsWith('https://lattice.gridplus.io/')
        ? 'allow'
        : 'deny',
    }));

    log.debug('Created lattice window');

    this.UIState.latticeWindow = latticeWindow;
  }
}
