import path from 'path';
import { app, Tray, Menu, shell } from 'electron';
import {
  metamaskDesktopAboutWebsite,
  metamaskDesktopSubmitTicket,
} from './ui-constants';
import UIState from './ui-state';

export default class AppNavigation {
  private UIState: typeof UIState;

  private tray?: Tray;

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

  public setPairedTrayIcon() {
    if (this.tray) {
      this.tray.setImage(
        path.resolve(__dirname, '../../../ui/icons/paired_icon.png'),
      );
    }
  }

  public setUnPairedTrayIcon() {
    if (this.tray) {
      this.tray.setImage(
        path.resolve(__dirname, '../../../ui/icons/unpaired_icon.png'),
      );
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

  private createSupportMenuItem() {
    return {
      label: 'Submit a ticket',
      click: async () => {
        await shell.openExternal(metamaskDesktopSubmitTicket);
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
        submenu: [
          this.createAboutMenuItem(),
          this.createSupportMenuItem(),
          this.createQuitMenuItem(),
        ],
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
      path.resolve(__dirname, '../../../ui/icons/unpaired_icon.png'),
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
    this.tray = tray;
  }
}
