export const determineLoginItemSettings = (preferredStartup: string) => {
  switch (preferredStartup) {
    case 'yes':
      return {
        openAtLogin: true,
        openAsHidden: false,
      };
    case 'no':
      return {
        openAtLogin: false,
        openAsHidden: false,
      };
    case 'minimized':
    default:
      return {
        openAtLogin: true,
        openAsHidden: true,
      };
  }
};
