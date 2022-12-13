import { app, globalShortcut } from 'electron';
import cfg from '../utils/config';
import AppNavigation from './app-navigation';
import UIState from './ui-state';

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
      // This is the second instance, we should quit
      app.quit();
      return;
    }

    // We wanted to show and focus if the second instance is opened
    app.on('second-instance', () => this.onSecondInstance());

    // On macOS: when the dock icon is clicked and there are no other windows open
    app.on('activate', () => this.onActivate());

    // Handle the protocol. In this case, we choose to show an Error Box.
    app.on('open-url', (_: any, url: string) => this.onOpenUrl(url));

    // 'before-quit' is emitted when Electron receives the signal to exit and wants to start closing windows.
    // This is for "dock right click -> quit" to work
    app.on('before-quit', () => this.beforeQuit());

    // Handle CMD + Q for MacOS
    if (process.platform === 'darwin') {
      globalShortcut.register('Command+Q', () => this.onCmdQPressed());
    }

    // Be able to open dev tools with CMD + SHIFT + I in dev mode
    if (process.env.DESKTOP_UI_DEBUG) {
      globalShortcut.register('CommandOrControl+Shift+I', () => {
        this.UIState.mainWindow?.webContents.openDevTools();
      });
    }

    // Do not close the app when the window is closed
    this.UIState.mainWindow?.on('close', (event: any) =>
      this.onWindowClose(event),
    );
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
