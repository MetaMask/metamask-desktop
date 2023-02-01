import { UiStorageSettings } from '../storage/ui-storage';

export const titleBarOverlayOpts = {
  dark: {
    color: '#24272a',
    symbolColor: '#FFFFFF',
    height: 32,
  },
  light: {
    color: '#ffffff',
    symbolColor: '#000000',
    height: 32,
  },
};

// TODO: Update this link to the correct one
export const metamaskDesktopAboutWebsite = 'https://metamask.io/desktop';
export const metamaskDesktopSubmitTicket =
  'https://github.com/MetaMask/metamask-desktop/discussions/new?category=general';

export const protocolKey = 'metamask-desktop';

export const uiAppStorage: UiStorageSettings = {
  name: 'app',
  schemaVersion: '0.0.0',
};

export const uiPairStatusStorage: UiStorageSettings = {
  name: 'pair-status',
  schemaVersion: '0.0.0',
};
