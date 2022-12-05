import { THEME_TYPE } from '../../ui/helpers/constants/themeIndex';

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

export const protocolKey = 'metamask-desktop';
