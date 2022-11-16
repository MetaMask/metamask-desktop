import { browser } from '@metamask/desktop';
import { DesktopState, RawState } from '../types/desktop';

export const get = async (): Promise<RawState> => {
  return await browser.storage.local.get();
};

export const getDesktopState = async (): Promise<DesktopState> => {
  const state = await get();
  return state.data?.DesktopController || {};
};

export const getAndUpdateDesktopState = async (
  desktopState: DesktopState,
): Promise<RawState> => {
  const state = await get();
  const currentDesktopState = state.data.DesktopController;

  state.data.DesktopController = { ...currentDesktopState, ...desktopState };

  return state;
};

export const set = async (state: RawState) => {
  await browser.storage.local.set(state);
};

export const setDesktopState = async (desktopState: DesktopState) => {
  const state = await getAndUpdateDesktopState(desktopState);
  await set(state);
};

export const clear = async () => {
  await browser.storage.local.clear();
};

export const addPairingKey = async (state: RawState): Promise<RawState> => {
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

export const removePairingKey = (state: RawState) => {
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
