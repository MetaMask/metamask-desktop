import path from 'path';
import { app, Tray, Menu, shell } from 'electron';
import { metamaskDesktopAboutWebsite } from './ui-constants';
import UIState from './ui-state';

export default class AppNavigation {
  private UIState: typeof UIState;

  constructor() {
    this.UIState = UIState;
  }

  public create() {
    // Create top-left menu for MacOS
    this.createMenu();

    // Create MacOS dock menu
    this.createDockMenu();

    // Create Tray icon
    this.createTray();
  }

  public showAndFocusMainWindow() {
    const { mainWindow } = this.UIState;
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  }

  private createShowMenuItem() {
    return {
      label: 'Show',
      click: () => {
        this.showAndFocusMainWindow();
      },
    };
  }

  private createAboutMenuItem() {
    return {
      label: 'About MetaMask Desktop',
      click: async () => {
        await shell.openExternal(metamaskDesktopAboutWebsite);
      },
    };
  }

  private createQuitMenuItem() {
    return {
      label: 'Quit',
      click: () => {
        this.UIState.forceQuit = true;
        app.quit();
      },
    };
  }

  private createMenu() {
    const menuTemplate = [
      {
        label: app.name,
        submenu: [this.createAboutMenuItem(), this.createQuitMenuItem()],
      },
    ];
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
  }

  private createDockMenu() {
    if (process.platform === 'darwin') {
      const dockMenuTemplate = [this.createAboutMenuItem()];
      const dockMenu = Menu.buildFromTemplate(dockMenuTemplate);
      app.dock.setMenu(dockMenu);
    }
  }

  private createTray() {
    const tray = new Tray(
      path.resolve(__dirname, '../../../ui/icons/icon.png'),
    );
    const trayMenuTemplate = [
      this.createShowMenuItem(),
      this.createQuitMenuItem(),
    ];
    const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
    tray.setToolTip('MetaMask Desktop');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      this.showAndFocusMainWindow();
    });
  }
}
