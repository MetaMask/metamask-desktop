import path from 'path';
import { app, BrowserWindow, nativeTheme } from 'electron';
import log from 'loglevel';
import { readPersistedSettingFromAppState } from '../storage/ui-storage';
import {
  PAIR_PAGE,
  METAMETRICS_OPT_IN_PAGE,
} from '../../shared/constants/ui-routes';
import UIState from './ui-state';
import { titleBarOverlayOpts } from './ui-constants';

export default class WindowService {
  private UIState: typeof UIState;

  constructor() {
    this.UIState = UIState;
  }

  public async createMainWindow() {
    const { wasOpenedAsHidden } = app.getLoginItemSettings();
    const mainWindow = new BrowserWindow({
      // Always set to false, otherwise the window will be shown before it is ready
      show: false,
      width: 840,
      height: 780,
      minWidth: 800,
      minHeight: 640,
      titleBarStyle: 'hidden',
      titleBarOverlay: titleBarOverlayOpts.light,
      webPreferences: {
        preload: path.resolve(__dirname, './preload.js'),
      },
      icon: path.resolve(__dirname, '../dist/app/icon.png'),
    });

    if (process.platform === 'win32') {
      // Keep this to prevent "alt" key is not triggering menu in Windows
      mainWindow?.setMenu(null);
    }

    mainWindow.loadFile(this.getHtmlPath(), this.getAppStartupPage());

    log.debug('Created main window');

    mainWindow.once('ready-to-show', () => {
      if (!wasOpenedAsHidden) {
        mainWindow.show();
      }
    });

    mainWindow.on('hide', () => {
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    });

    mainWindow.on('show', () => {
      if (process.platform === 'darwin') {
        app.dock.show();
      }
    });

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
      path.resolve(__dirname, '../../../html/desktop-trezor.html'),
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
      path.resolve(__dirname, '../../../html/desktop-lattice.html'),
    );

    latticeWindow.webContents.setWindowOpenHandler((details) => ({
      action: details.url.startsWith('https://lattice.gridplus.io/')
        ? 'allow'
        : 'deny',
    }));

    log.debug('Created lattice window');

    this.UIState.latticeWindow = latticeWindow;
  }

  private getHtmlPath() {
    const darkHtmlPath = path.resolve(
      __dirname,
      '../../../../ui/desktop-ui-dark.html',
    );
    const lightHtmlPath = path.resolve(
      __dirname,
      '../../../../ui/desktop-ui.html',
    );
    let htmlPath;

    const selectedTheme = readPersistedSettingFromAppState({
      defaultValue: 'os',
      key: 'theme',
    });

    if (selectedTheme === 'os') {
      if (nativeTheme.shouldUseDarkColors) {
        htmlPath = darkHtmlPath;
      } else {
        htmlPath = lightHtmlPath;
      }
    } else if (selectedTheme === 'dark') {
      htmlPath = darkHtmlPath;
    } else {
      htmlPath = lightHtmlPath;
    }
    return path.resolve(__dirname, htmlPath);
  }

  private getAppStartupPage() {
    const isMetametricsOptionSelected = readPersistedSettingFromAppState({
      defaultValue: false,
      key: 'isMetametricsOptionSelected',
    });

    const startupPage = isMetametricsOptionSelected
      ? PAIR_PAGE
      : METAMETRICS_OPT_IN_PAGE;

    return { hash: startupPage };
  }
}
