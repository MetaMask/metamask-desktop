import { THEME_TYPE } from '../../submodules/extension/ui/desktop/helpers/constants/themeIndex';

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
