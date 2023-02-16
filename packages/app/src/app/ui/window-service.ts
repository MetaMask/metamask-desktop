import path from 'path';
import { app, BrowserWindow, nativeTheme } from 'electron';
import { debounce } from 'lodash';
import log from 'loglevel';
import { readPersistedSettingFromAppState } from '../storage/ui-storage';
import {
  PAIR_PAGE,
  METAMETRICS_OPT_IN_PAGE,
} from '../../shared/constants/ui-routes';
import * as windowConstants from '../../shared/constants/window';
import UIState from './ui-state';
import { titleBarOverlayOpts } from './ui-constants';

export default class WindowService {
  private UIState: typeof UIState;

  private size: { width: number; height: number };

  private position: { x: number; y: number };

  constructor() {
    this.UIState = UIState;
    const { x, y, width, height } = readPersistedSettingFromAppState({
      defaultValue: {
        x: undefined,
        y: undefined,
        width: windowConstants.DEFAULT_WINDOW_WIDTH,
        height: windowConstants.DEFAULT_WINDOW_HEIGHT,
      },
      key: 'window',
    });
    this.size = { width, height };
    this.position = { x, y };
  }

  public async createMainWindow() {
    const { wasOpenedAsHidden } = app.getLoginItemSettings();
    const mainWindow = new BrowserWindow({
      // Always set to false, otherwise the window will be shown before it is ready
      show: false,
      width: this.size.width,
      height: this.size.height,
      x: this.position.x,
      y: this.position.y,
      minWidth: windowConstants.MIN_WINDOW_WIDTH,
      minHeight: windowConstants.MIN_WINDOW_HEIGHT,
      titleBarStyle: 'hidden',
      titleBarOverlay: titleBarOverlayOpts.light,
      webPreferences: {
        preload: path.resolve(__dirname, './preload.js'),
      },
      icon: path.resolve(__dirname, '../icons/icon.png'),
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

    mainWindow.on('show', () => {
      if (process.platform === 'darwin') {
        app.dock.show();
      }
    });

    mainWindow.on(
      'resized',
      debounce(() => {
        const { width, height } = mainWindow.getBounds();
        mainWindow.webContents.send('resized', { width, height });
        this.size = { width, height };
      }, windowConstants.UPDATE_FREQUENCY_MS),
    );

    mainWindow.on(
      'moved',
      debounce(() => {
        const { x, y } = mainWindow.getBounds();
        mainWindow.webContents.send('moved', { x, y });
        this.position = { x, y };
      }, windowConstants.UPDATE_FREQUENCY_MS),
    );

    this.UIState.mainWindow = mainWindow;
  }

  public async createApprovalWindow() {
    const approvalWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        preload: path.resolve(__dirname, './preload.js'),
      },
      icon: path.resolve(__dirname, '../dist/app/icon.png'),
    });

    approvalWindow.setAlwaysOnTop(true, 'screen-saver');

    if (process.platform === 'win32') {
      // Keep this to prevent "alt" key is not triggering menu in Windows
      approvalWindow?.setMenu(null);
    }

    approvalWindow.loadFile(this.getHtmlPath(), { hash: '/' });

    log.debug('Created approval window');

    this.UIState.approvalWindow = approvalWindow;
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
