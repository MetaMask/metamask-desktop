const {
  TASKS: EXTENSION_TASKS,
} = require('../../submodules/extension/development/build/constants');

const TASKS = {
  ...EXTENSION_TASKS,
  SCRIPTS_CORE_DEV_STANDARD_ENTRY_POINTS_DESKTOPUI:
    'scripts:core:dev:standardEntryPoints:desktopui',
  SCRIPTS_CORE_DIST_STANDARD_ENTRY_POINTS_DESKTOPUI:
    'scripts:core:dist:standardEntryPoints:desktopui',
  SCRIPTS_CORE_PROD_STANDARD_ENTRY_POINTS_DESKTOPUI:
    'scripts:core:prod:standardEntryPoints:desktopui',
  SCRIPTS_CORE_TEST_STANDARD_ENTRY_POINTS_DESKTOPUI:
    'scripts:core:test:standardEntryPoints:desktopui',
  STYLES_DEV_DESKTOP_UI: `${EXTENSION_TASKS.STYLES_DEV}:desktopui`,
  STYLES_PROD_DESKTOP_UI: `${EXTENSION_TASKS.STYLES_PROD}:desktopui`,
  STYLES_DEV_DESKTOP_POPUP_UI: `${EXTENSION_TASKS.STYLES_DEV}:desktop:popup`,
  STYLES_PROD_DESKTOP_POPUP_UI: `${EXTENSION_TASKS.STYLES_PROD}:desktop:popup`,
};

module.exports = { TASKS };
