import { THEME_TYPE } from '../../../pages/settings/settings-tab/settings-tab.constant';

const handleOSTheme = () => {
  const osTheme = window?.matchMedia('(prefers-color-scheme: dark)')?.matches
    ? THEME_TYPE.DARK
    : THEME_TYPE.LIGHT;
  document.documentElement.setAttribute('data-theme', osTheme);
};

const setTheme = (theme) => {
  if (theme === THEME_TYPE.OS) {
    handleOSTheme();
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
};

export default setTheme;
