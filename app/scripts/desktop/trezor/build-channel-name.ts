const channelPrefix = 'trezor-connect';
const responseSufix = 'response';

export const buildChannelName = (identifier: string, isResponse = false) => {
  return `${channelPrefix}-${identifier}${
    isResponse ? `-${responseSufix}` : ''
  }`;
};
