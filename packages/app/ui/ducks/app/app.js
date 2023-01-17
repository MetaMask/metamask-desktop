import setTheme from '../../helpers/utils/theme';

export const initialAppState = {
  theme: 'os',
  language: 'en',
  metametricsOptIn: false,
  openAtLogin: true,
};

// Actions
export const UPDATE_THEME = 'UPDATE_THEME';
export const UPDATE_LANGUAGE = 'UPDATE_LANGUAGE';
export const UPDATE_METAMETRICS_OPT_IN = 'UPDATE_METAMETRICS_OPT_IN';
export const UPDATE_OPEN_AT_LOGIN = 'UPDATE_OPEN_AT_LOGIN';

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

    case UPDATE_METAMETRICS_OPT_IN: {
      return {
        ...state,
        metametricsOptIn: action.payload,
      };
    }

    case UPDATE_OPEN_AT_LOGIN: {
      window.electronBridge.setOpenAtLogin(action.payload);
      return {
        ...state,
        openAtLogin: action.payload,
      };
    }
    default:
      return state;
  }
}

// Selectors
export const getTheme = (state) => state.app.theme;
export const getLanguage = (state) => state.app.language;
export const getMetametricsOptIn = (state) => state.app.metametricsOptIn;
export const getOpenAtLogin = (state) => state.app.openAtLogin;

// Action Creators
export function updateTheme(payload) {
  return { type: UPDATE_THEME, payload };
}
export function updateLanguage(payload) {
  return { type: UPDATE_LANGUAGE, payload };
}

export function updateMetametricsOptIn(payload) {
  return { type: UPDATE_METAMETRICS_OPT_IN, payload };
}

export function updateOpenAtLogin(payload) {
  return { type: UPDATE_OPEN_AT_LOGIN, payload };
}
