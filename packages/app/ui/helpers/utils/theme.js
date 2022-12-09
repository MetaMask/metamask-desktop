import { THEME_TYPE } from '../../../submodules/extension/ui/pages/settings/settings-tab/settings-tab.constant';

// eslint-disable-next-line node/no-extraneous-require
const { ipcRenderer } = window.require('electron');

const getOSTheme = () => {
  return window?.matchMedia('(prefers-color-scheme: dark)')?.matches
    ? THEME_TYPE.DARK
    : THEME_TYPE.LIGHT;
};

const handleOSTheme = () => {
  const osTheme = getOSTheme();
  document.documentElement.setAttribute('data-theme', osTheme);
};

const setTheme = (theme) => {
  let themeCode = theme;
  if (theme === THEME_TYPE.OS) {
    handleOSTheme();
    themeCode = getOSTheme();
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  ipcRenderer.invoke('set-theme', themeCode);
};

export default setTheme;
