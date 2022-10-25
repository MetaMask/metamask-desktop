import * as themeHelpers from '../../helpers/utils/theme';
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
    // Set theme fn
    jest.spyOn(themeHelpers, 'default').mockImplementation();
    const state = appReducer(initialState, {
      type: UPDATE_THEME,
      payload: 'dark',
    });

    expect(state.theme).toStrictEqual('dark');
    expect(themeHelpers.default).toHaveBeenCalledWith('dark');
  });

  it('updates language', () => {
    const state = appReducer(initialState, {
      type: UPDATE_LANGUAGE,
      payload: 'en',
    });

    expect(state.language).toStrictEqual('en');
  });
});
