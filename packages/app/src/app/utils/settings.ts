import { STARTUP_OPTION_TYPES } from '../../shared/constants/startup-option';

export const determineLoginItemSettings = (preferredStartup: string) => {
  switch (preferredStartup) {
    case STARTUP_OPTION_TYPES.YES:
      return {
        openAtLogin: true,
        openAsHidden: false,
      };
    case STARTUP_OPTION_TYPES.NO:
      return {
        openAtLogin: false,
        openAsHidden: false,
      };
    case STARTUP_OPTION_TYPES.MINIMIZED:
    default:
      return {
        openAtLogin: true,
        openAsHidden: true,
      };
  }
};
