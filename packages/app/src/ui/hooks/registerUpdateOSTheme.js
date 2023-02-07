import { THEME_TYPES } from '../../shared/constants/theme';
import { getTheme } from '../ducks/app/app';
import setTheme from '../helpers/theme';

export default function registerUpdateOSTheme(store) {
  return () => {
    getTheme(store.getState()) === THEME_TYPES.OS && setTheme(THEME_TYPES.OS);
  };
}
