import { contextBridge, ipcRenderer } from 'electron';
import { Properties, Traits } from '../types/metrics';

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
  onResized: (callback: (size: { width: number; height: number }) => void) => {
    ipcRenderer.on('resized', (_, size) => {
      callback(size);
    });
  },
  onMoved: (callback: (position: { x: number; y: number }) => void) => {
    ipcRenderer.on('moved', (_, position) => {
      callback(position);
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
  syncTheme: async (theme: string) => {
    await ipcRenderer.invoke('sync-theme', theme);
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
  track: (eventName: string, properties: Properties) => {
    return ipcRenderer.invoke('analytics-track', eventName, properties);
  },
  identify: (traits: Traits) => {
    return ipcRenderer.invoke('analytics-identify', traits);
  },
  analyticsPendingEventsHandler: (metricsDecision: boolean) => {
    return ipcRenderer.invoke(
      'analytics-pending-events-handler',
      metricsDecision,
    );
  },
  toggleDesktopPopup: async (isEnabled: boolean) => {
    await ipcRenderer.invoke('toggle-desktop-popup', isEnabled);
  },
  openDialog: (method: string, config: any) =>
    ipcRenderer.invoke('ui-dialog', method, config),
};

contextBridge.exposeInMainWorld('electronBridge', electronBridge);
contextBridge.exposeInMainWorld('config', {
  enableDesktopPopup: process.env.DESKTOP_POPUP === 'true',
});

export type ElectronBridge = typeof electronBridge;
