import setTheme from '../../helpers/utils/theme';

export const initialAppState = {
  theme: 'os',
  language: 'en',
};

// Actions
export const UPDATE_THEME = 'UPDATE_THEME';
export const UPDATE_LANGUAGE = 'UPDATE_LANGUAGE';

// Reducer
export default function appReducer(state = initialAppState, action) {
  switch (action.type) {
    case UPDATE_THEME: {
      setTheme(action.payload);
      return {
        ...state,
        theme: action.payload,
      };
    }
    case UPDATE_LANGUAGE: {
      return {
        ...state,
        language: action.payload,
      };
    }
    default:
      return state;
  }
}

// Selectors
export const getTheme = (state) => state.app.theme;
export const getLanguage = (state) => state.app.language;

// Action Creators
export function updateTheme(payload) {
  return { type: UPDATE_THEME, payload };
}
export function updateLanguage(payload) {
  return { type: UPDATE_LANGUAGE, payload };
}
