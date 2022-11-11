import { UPDATE_LANGUAGE } from '../app/app';
import localesReducer, { initialLocalesState } from './locale';

jest.mock('../../locales', () => ({
  locales: {
    en: {
      testProp: {
        message: 'testPropEN',
      },
    },
    de: {
      testProp: {
        message: 'testPropDE',
      },
    },
  },
}));

describe('Locale State', () => {
  const initialState = initialLocalesState;

  it('locale init state', () => {
    const initState = localesReducer(initialState, {});
    expect.anything(initState);
  });

  it('updates language', () => {
    const state = localesReducer(initialState, {
      type: UPDATE_LANGUAGE,
      payload: 'de',
    });
    expect(state.current.testProp.message).toStrictEqual('testPropDE');
  });
});
