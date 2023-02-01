import path from 'path';
import { app, Tray, Menu, shell, dialog } from 'electron';
import { getDesktopState } from '@metamask/desktop/dist/utils/state';
import { t } from '../utils/translation';
import { MMD_WEBSITE, URL_SUBMIT_TICKET } from '../../shared/constants/links';
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
      this.tray.setImage(path.resolve(__dirname, '../icons/paired_icon.png'));
    }
  }

  public setUnPairedTrayIcon() {
    if (this.tray) {
      this.tray.setImage(path.resolve(__dirname, '../icons/unpaired_icon.png'));
    }
  }

  private createShowMenuItem() {
    return {
      label: t('show'),
      click: () => {
        this.showAndFocusMainWindow();
      },
    };
  }

  private createAboutMenuItem() {
    return {
      label: t('aboutMMD'),
      click: async () => {
        await shell.openExternal(MMD_WEBSITE);
      },
    };
  }

  private createSupportMenuItem() {
    return {
      label: t('submitTicket'),
      click: async () => {
        await shell.openExternal(URL_SUBMIT_TICKET);
      },
    };
  }

  private createQuitMenuItem() {
    return {
      label: 'Quit',
      click: async () => {
        const isDesktopPaired =
          (await getDesktopState()).desktopEnabled === true;
        if (isDesktopPaired) {
          const { response: forceExit } = await dialog.showMessageBox({
            type: 'warning',
            buttons: [t('ok'), t('exit')],
            cancelId: 0,
            defaultId: 1,
            icon: path.resolve(__dirname, '../../dist/app/icon.png'),
            title: 'Warning',
            message: t('approveQuitApp'),
          });
          if (forceExit) {
            this.UIState.forceQuit = true;
            app.quit();
          }
          return;
        }
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
      path.resolve(__dirname, '../icons/unpaired_icon.png'),
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
