import { DesktopState, RawState } from '../../types';
import { browser } from '../../browser';

export const getRawState = async (): Promise<RawState> => {
  return await browser.storage.local.get();
};

export const getDesktopState = async (): Promise<DesktopState> => {
  const state = await getRawState();
  return state.data?.DesktopController || {};
};

export const getAndUpdateDesktopState = async (
  desktopState: DesktopState,
): Promise<RawState> => {
  const state = await getRawState();
  const currentDesktopState = state.data.DesktopController;

  state.data.DesktopController = { ...currentDesktopState, ...desktopState };

  return state;
};

export const setRawState = async (state: RawState) => {
  await browser.storage.local.set(state);
};

export const setDesktopState = async (desktopState: DesktopState) => {
  const state = await getAndUpdateDesktopState(desktopState);
  await setRawState(state);
};

export const clearRawState = async () => {
  await browser.storage.local.clear();
};

export const addPairingKeyToRawState = async (
  state: RawState,
): Promise<RawState> => {
  const existingDeskotpState = await getDesktopState();

  return {
    ...state,
    data: {
      ...state.data,
      DesktopController: {
        ...state.data?.DesktopController,
        pairingKey: existingDeskotpState.pairingKey,
        pairingKeyHash: existingDeskotpState.pairingKeyHash,
      },
    },
  };
};

export const removePairingKeyFromRawState = (state: RawState) => {
  return {
    ...state,
    data: {
      ...state.data,
      DesktopController: {
        ...state.data.DesktopController,
        pairingKey: undefined,
        pairingKeyHash: undefined,
      },
    },
  };
};
