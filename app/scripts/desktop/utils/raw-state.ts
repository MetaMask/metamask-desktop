import { browser } from '../browser/browser-polyfill';
import { DesktopState } from '../types/desktop';

let cachedDesktopState: DesktopState;

export const get = async (): Promise<any> => {
  const state = await browser.storage.local.get();
  cachedDesktopState = state.data?.DesktopController || {};
  return state;
};

export const getDesktopState = async (): Promise<DesktopState> => {
  const state = await get();
  return state.data?.DesktopController || {};
};

export const getCachedDesktopState = (): DesktopState => {
  return cachedDesktopState || {};
};

export const getAndUpdateDesktopState = async (
  desktopState: DesktopState,
): Promise<any> => {
  const state = await get();
  const currentDesktopState = state.data.DesktopController;

  state.data.DesktopController = { ...currentDesktopState, ...desktopState };

  return state;
};

export const set = async (state: any) => {
  await browser.storage.local.set(state);
  cachedDesktopState = state.data?.DesktopController || {};
};

export const setDesktopState = async (desktopState: DesktopState) => {
  const state = await getAndUpdateDesktopState(desktopState);
  await set(state);
};

export const clear = async () => {
  await browser.storage.local.clear();
};
