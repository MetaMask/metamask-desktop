import path from 'path';
import { BrowserWindow } from 'electron';
import log from 'loglevel';
import { MILLISECOND } from '../../submodules/extension/shared/constants/time';
import UIState from './ui-state';
import { titleBarOverlayOpts } from './ui-constants';

const MAIN_WINDOW_SHOW_DELAY = 750 * MILLISECOND;

export default class WindowService {
  private UIState: typeof UIState;

  constructor() {
    this.UIState = UIState;
  }

  public async createMainWindow() {
    const mainWindow = new BrowserWindow({
      width: 800,
      height: 640,
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

    mainWindow.loadFile(
      path.resolve(__dirname, '../../../ui/desktop-ui.html'),
      // Temporary open pair page, it will redirect to settings page if isDesktopPaired is true
      { hash: 'pair' },
    );

    setTimeout(() => {
      mainWindow.show();
    }, MAIN_WINDOW_SHOW_DELAY);

    log.debug('Created status window');

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
