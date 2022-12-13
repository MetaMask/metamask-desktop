import { contextBridge, ipcRenderer } from 'electron';

const uiStoreBridge = (name: string) => {
  return {
    getItem: (key: string) => {
      return ipcRenderer.invoke(`${name}-store-get`, key);
    },
    setItem: async (key: string, value: any) => {
      await ipcRenderer.invoke(`${name}-store-set`, key, value);
    },
    removeItem: async (key: string) => {
      await ipcRenderer.invoke(`${name}-store-delete`, key);
    },
  };
};

const electronBridge = {
  rootStore: uiStoreBridge('root'),
  pairStatusStore: uiStoreBridge('pair-status'),
  desktopVersion: () => {
    return ipcRenderer.invoke('get-desktop-version') as Promise<string>;
  },
  onStatusChange: (callback: (statusData: any) => void) => {
    ipcRenderer.on('status', (_, statusData: any) => {
      callback(statusData);
    });
  },
  onUrlRequests: (callback: (url: string) => void) => {
    ipcRenderer.on('url-request', (_, url) => {
      callback(url);
    });
  },
  onInvalidOtp: (callback: () => void) => {
    ipcRenderer.on('invalid-otp', () => {
      callback();
    });
  },
  removeInvalidOtpListeners: () => {
    ipcRenderer.removeAllListeners('invalid-otp');
  },
  sendOtp: async (otpValue: string) => {
    await ipcRenderer.invoke('otp', otpValue);
  },
  unpair: async () => {
    await ipcRenderer.invoke('unpair');
  },
  reset: async () => {
    await ipcRenderer.invoke('reset');
  },
  setTheme: async (themeCode: string) => {
    await ipcRenderer.invoke('set-theme', themeCode);
  },
};

contextBridge.exposeInMainWorld('electronBridge', electronBridge);

export type ElectronBridge = typeof electronBridge;
