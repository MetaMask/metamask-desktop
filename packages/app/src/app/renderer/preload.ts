import { contextBridge, ipcRenderer, shell } from 'electron';

const uiStoreBridge = (name: string) => {
  return {
    getItem: (key: string) => {
      return ipcRenderer.invoke(`${name}-store-get`, key);
    },
    setItem: async (key: string, value: unknown) => {
      await ipcRenderer.invoke(`${name}-store-set`, key, value);
    },
    removeItem: async (key: string) => {
      await ipcRenderer.invoke(`${name}-store-delete`, key);
    },
  };
};

const electronBridge = {
  appStore: uiStoreBridge('app'),
  pairStatusStore: uiStoreBridge('pair-status'),
  desktopVersion: () => {
    return ipcRenderer.invoke('get-desktop-version') as Promise<string>;
  },
  onStatusChange: (callback: (statusData: unknown) => void) => {
    ipcRenderer.on('status', (_, statusData) => {
      callback(statusData);
    });
  },
  simulateError: (callback: () => void) => {
    ipcRenderer.on('simulate-error', () => {
      console.log('msg arrived') 
      const error = new Error('Error render process')
      console.error('Something wrong happened on render process', error)
      throw error
      callback();
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
  error: async () => {
    console.log('msg arrived')
    const error = new Error('Error render process')
    console.error('Something wrong happened on render process', error)
    throw error
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
  openExternalShell: async (link: string) => {
    await shell.openExternal(link);
  },
  setPreferredStartup: async (preferredStartup: string) => {
    await ipcRenderer.invoke('set-preferred-startup', preferredStartup);
  },
};

contextBridge.exposeInMainWorld('electronBridge', electronBridge);

export type ElectronBridge = typeof electronBridge;
