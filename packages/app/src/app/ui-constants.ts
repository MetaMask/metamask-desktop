import { THEME_TYPE } from '../../ui/helpers/constants/themeIndex';
import { UiStorageSettings } from './ui-storage';

export const titleBarOverlayOpts = {
  [THEME_TYPE.DARK]: {
    color: '#24272a',
    symbolColor: '#FFFFFF',
    height: 32,
  },
  [THEME_TYPE.LIGHT]: {
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

export const uiRootStorage: UiStorageSettings = {
  name: 'root',
  schemaVersion: '0.0.0',
};

export const uiPairStatusStorage: UiStorageSettings = {
  name: 'pair-status',
  schemaVersion: '0.0.0',
};
