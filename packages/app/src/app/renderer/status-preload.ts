import { contextBridge, ipcRenderer } from 'electron';

const uiStoreBridge = (name: string) => {
  return {
    getItem(key: string) {
      console.log('BRIDGE - INVOKE: GET ITEM', key);
      return ipcRenderer.invoke(`${name}-store-get`, key);
    },
    setItem(key: string, value: any) {
      console.log('BRIDGE - INVOKE: SET ITEM', key, value);
      return ipcRenderer.invoke(`${name}-store-set`, key, value);
    },
    removeItem(key: string) {
      console.log('BRIDGE - INVOKE: REMOVE ITEM', key);
      return ipcRenderer.invoke(`${name}-store-delete`, key);
    },
  };
};

contextBridge.exposeInMainWorld('electron', {
  rootStore: uiStoreBridge('root'),
  pairStatusStore: uiStoreBridge('pair-status'),
  desktopVersion: () => {
    console.log('BRIDGE - INVOKE: DESKTOP VERSION');
    ipcRenderer.invoke('get-desktop-version');
  },
  onStatusChange: (callback: any) => {
    ipcRenderer.on('status', (_, statusData: any) => {
      console.log('BRIDGE - EVENT: STATUS');
      callback(statusData);
    });
  },
  onUrlRequests: (callback: any) => {
    ipcRenderer.on('url-request', (_, url) => {
      console.log('BRIDGE - EVENT: URL REQUEST');
      callback(url);
    });
  },
  onInvalidOtp: (callback: any) => {
    ipcRenderer.on('invalid-otp', () => {
      console.log('BRIDGE - EVENT: INVALID OTP');
      callback();
    });
  },
  removeInvalidOtpListeners: () => {
    console.log('BRIDGE - REMOVEALLLISTENERS: INVALID OTP');
    ipcRenderer.removeAllListeners('invalid-otp');
  },
  sendOtp: (otpValue: any) => {
    console.log('BRIDGE - INVOKE: SEND OTP', otpValue);
    ipcRenderer.invoke('otp', otpValue);
  },
  unpair: () => {
    console.log('BRIDGE - INVOKE: UNPAIR');
    ipcRenderer.invoke('unpair');
  },
  reset: () => {
    console.log('BRIDGE - INVOKE: RESET');
    ipcRenderer.invoke('reset');
  },
  setTheme: (themeCode: any) => {
    console.log('BRIDGE - INVOKE: SETTHEME', themeCode);
    ipcRenderer.invoke('set-theme', themeCode);
  },
});
