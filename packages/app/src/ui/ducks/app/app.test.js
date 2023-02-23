import * as themeHelpers from '../../helpers/theme';
import appReducer, {
  initialAppState,
  UPDATE_THEME,
  UPDATE_LANGUAGE,
} from './app';

describe('App State', () => {
  const initialState = initialAppState;

  it('app init state', () => {
    const initState = appReducer(initialState, {});
    expect.anything(initState);
  });

  it('updates theme', () => {
    const syncThemeMock = jest.fn();
    global.window.electronBridge = {
      syncTheme: syncThemeMock,
    };

    jest.spyOn(themeHelpers, 'default').mockImplementation();
    const state = appReducer(initialState, {
      type: UPDATE_THEME,
      payload: 'dark',
    });

    expect(state.theme).toStrictEqual('dark');
    expect(themeHelpers.default).toHaveBeenCalledWith('dark');
    expect(syncThemeMock).toHaveBeenCalledWith('dark');
  });

  it('updates language', () => {
    const setLanguageMock = jest.fn();
    global.window.electronBridge = {
      setLanguage: setLanguageMock,
    };
    const state = appReducer(initialState, {
      type: UPDATE_LANGUAGE,
      payload: 'en',
    });

    expect(setLanguageMock).toHaveBeenCalledWith('en');
    expect(state.language).toStrictEqual('en');
  });
});
