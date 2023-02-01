import { THEME_TYPES } from '../../shared/constants/theme';

const getOSTheme = () => {
  return window?.matchMedia('(prefers-color-scheme: dark)')?.matches
    ? THEME_TYPES.DARK
    : THEME_TYPES.LIGHT;
};

const handleOSTheme = () => {
  const osTheme = getOSTheme();
  document.documentElement.setAttribute('data-theme', osTheme);
};

const setTheme = (theme) => {
  let themeCode = theme;
  if (theme === THEME_TYPES.OS) {
    handleOSTheme();
    themeCode = getOSTheme();
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  window.electronBridge.setTheme(themeCode);
};

export default setTheme;
