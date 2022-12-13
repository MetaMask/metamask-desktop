import { contextBridge, ipcRenderer } from 'electron';

// import { getDesktopVersion } from '../utils/version';

contextBridge.exposeInMainWorld('electron', {
  desktopVersion: 99,
  pairStatusStore: {
    getItem(key: any) {
      return new Promise((resolve) => {
        resolve(ipcRenderer.sendSync('pair-status-store-get', key));
      });
    },
    setItem(key: any, val: any) {
      return new Promise<void>((resolve) => {
        ipcRenderer.send('pair-status-store-set', key, val);
        resolve();
      });
    },
    removeItem(key: any) {
      return new Promise<void>((resolve) => {
        ipcRenderer.send('pair-status-store-delete', key);
        resolve();
      });
    },
  },
  rootStore: {
    getItem(key: any) {
      return new Promise((resolve) => {
        resolve(ipcRenderer.sendSync('root-store-get', key));
      });
    },
    setItem(key: any, val: any) {
      return new Promise<void>((resolve) => {
        ipcRenderer.send('root-store-set', key, val);
        resolve();
      });
    },
    removeItem(key: any) {
      return new Promise<void>((resolve) => {
        ipcRenderer.send('root-store-delete', key);
        resolve();
      });
    },
  },
  setTheme: (themeCode: any) => {
    console.log('BRIDGE - CALL SETTHEME', themeCode);
    ipcRenderer.invoke('set-theme', themeCode);
  },
  otp: {
    invalidOtp: (callback: any) => {
      ipcRenderer.on('invalid-otp', () => {
        console.log('BRIDGE - INVALID OTP EVENT');
        callback();
      });
    },
    removeAllListeners: () => {
      console.log('BRIDGE - CALL RENIVEALLLISTENERS');
      ipcRenderer.removeAllListeners('invalid-otp');
    },
    sendOtp: (otpValue: any) => {
      console.log('BRIDGE - CALL SEND OTP', otpValue);
      ipcRenderer.invoke('otp', otpValue);
    },
  },
  unpair: () => {
    console.log('BRIDGE - CALL UNPAIR');
    ipcRenderer.invoke('unpair');
  },
  reset: () => {
    console.log('BRIDGE - CALL RESET');
    ipcRenderer.invoke('reset');
  },
  registerUrlRequests: (callback: any) => {
    ipcRenderer.on('url-request', (_, url) => {
      console.log('BRIDGE - URL REQUEST EVENT');
      callback(url);
    });
  },
  onStatusChange: (callback: any) => {
    ipcRenderer.on('status', callback);
  },
});
