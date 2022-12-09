import { THEME_TYPE } from '../helpers/constants/themeIndex';
import { getTheme } from '../ducks/app/app';
import setTheme from '../helpers/utils/theme';

export default function registerUpdateOSTheme(store) {
  return () => {
    getTheme(store.getState()) === THEME_TYPE.OS && setTheme(THEME_TYPE.OS);
  };
}
