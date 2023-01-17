import { app, globalShortcut } from 'electron';
import cfg from '../utils/config';
import AppNavigation from './app-navigation';
import UIState from './ui-state';
import { getPersistedAppState } from './ui-storage';


export default class AppEvents {
  public appNavigation: AppNavigation;

  public UIState: typeof UIState;

  private gotTheLock: boolean;

  constructor() {
    this.appNavigation = new AppNavigation();
    this.UIState = UIState;
    this.gotTheLock = app?.requestSingleInstanceLock?.();
  }

  public register() {
    if (!this.gotTheLock && !cfg().isUnitTest) {
      // Force quit if the second instance is opened
      app.quit();
      return;
    }

    let openAtLogin = true;
    try {
      const appState = getPersistedAppState();
      openAtLogin = appState.openAtLogin;
    } catch (error) {
      log.error('Error getting persisted app state', error);
    }

    // Set open at login
    app.setLoginItemSettings({
      openAtLogin,
    });

    // Focus MainWindow if the second instance is opened
    app.on('second-instance', () => this.onSecondInstance());

    // Handle incoming protocol requests (deep linking)
    app.on('open-url', (_: any, url: string) => this.onOpenUrl(url));

    // Prevent app close if close emitted from window
    this.UIState.mainWindow?.on('close', (event: any) =>
      this.onWindowClose(event),
    );

    // For "Dock right click -> quit"
    app.on('before-quit', () => this.beforeQuit());

    // On MacOS: When the dock icon is clicked and there are no other windows open
    app.on('activate', () => this.onActivate());

    // On MacOS: Handle CMD+Q
    if (process.platform === 'darwin') {
      globalShortcut.register('Command+Q', () => this.onCmdQPressed());
    }

    // On Development: Open dev tools with CMD+SHIFT+I
    if (process.env.DESKTOP_UI_DEBUG) {
      globalShortcut.register('CommandOrControl+Shift+I', () => {
        this.UIState.mainWindow?.webContents.openDevTools();
      });
    }
  }

  private onSecondInstance() {
    this.appNavigation.showAndFocusMainWindow();
  }

  private onActivate() {
    this.appNavigation.showAndFocusMainWindow();
  }

  private onOpenUrl(url: string) {
    const { mainWindow } = this.UIState;
    if (mainWindow) {
      this.appNavigation.showAndFocusMainWindow();
      mainWindow.webContents.send('url-request', url);
    }
  }

  private beforeQuit() {
    this.UIState.forceQuit = true;
  }

  private onCmdQPressed() {
    this.UIState.forceQuit = true;
    app.quit();
  }

  private onWindowClose(event: any) {
    if (!process.env.DESKTOP_UI_FORCE_CLOSE) {
      // Check if close emitted from menu
      if (this.UIState.forceQuit) {
        app.exit(0);
      } else {
        event.preventDefault();
        this.UIState.mainWindow?.hide();
      }
    }
  }
}
