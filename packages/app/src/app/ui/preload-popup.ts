import { contextBridge, ipcRenderer } from 'electron';

const popupElectronBridge = {
  sendBackgroundMessage: async (data: any) => {
    ipcRenderer.send('approval-ui', { name: 'controller', data });
  },
  addBackgroundMessageListener: (listener: (data: any) => void) => {
    ipcRenderer.on('approval-ui', (_: any, data: any) => {
      listener(data);
    });
  },
};

contextBridge.exposeInMainWorld('popupElectronBridge', popupElectronBridge);

export type PopupElectronBridge = typeof popupElectronBridge;
