import { contextBridge, ipcRenderer } from 'electron';

const uiStoreBridge = (name: string) => {
  return {
    getItem: (key: string) => {
      return ipcRenderer.invoke(`${name}-store-get`, key);
    },
    setItem: async (_key: string, _value: unknown) => undefined,
    removeItem: async (_key: string) => undefined,
  };
};

const popupElectronBridge = {
  appStore: uiStoreBridge('app'),
  sendBackgroundMessage: async (data: any) => {
    ipcRenderer.send('approval-ui', { name: 'controller', data });
  },
  addBackgroundMessageListener: (listener: (data: any) => void) => {
    ipcRenderer.on('approval-ui', (_: any, data: any) => {
      listener(data);
    });
  },
  setTheme: async (themeCode: string) => {
    await ipcRenderer.invoke('set-theme', themeCode);
  },
  onThemeChanged: (listener: (theme: string) => void) => {
    ipcRenderer.on('theme-changed', (_: any, theme: string) => {
      listener(theme);
    });
  },
  onShow: (listener: () => void) => {
    ipcRenderer.on('show', () => {
      listener();
    });
  },
};

contextBridge.exposeInMainWorld('popupElectronBridge', popupElectronBridge);

export type PopupElectronBridge = typeof popupElectronBridge;
