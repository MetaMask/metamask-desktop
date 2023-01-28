import { BrowserWindow } from 'electron';

class UIState {
  public mainWindow?: BrowserWindow;

  public trezorWindow?: BrowserWindow;

  public latticeWindow?: BrowserWindow;

  public approvalWindow?: BrowserWindow;

  public forceQuit: boolean;

  constructor() {
    this.forceQuit = false;
  }
}

export default new UIState();
