import { contextBridge, ipcRenderer } from 'electron';
import { Properties } from '../../types/metrics';

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

const analyticsBridge = (name: string) => {
  return {
    track: (eventName: string, properties: Properties) => {
      return ipcRenderer.invoke(`${name}-track`, eventName, properties);
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
  openExternalShell: async (link: string) => {
    await ipcRenderer.invoke('open-external', link);
  },
  setPreferredStartup: async (preferredStartup: string) => {
    await ipcRenderer.invoke('set-preferred-startup', preferredStartup);
  },
  setLanguage: async (language: string) => {
    await ipcRenderer.invoke('set-language', language);
  },
  analytics: analyticsBridge('analytics'),
};

contextBridge.exposeInMainWorld('electronBridge', electronBridge);

export type ElectronBridge = typeof electronBridge;
