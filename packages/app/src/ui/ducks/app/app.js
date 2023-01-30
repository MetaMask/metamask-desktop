import setTheme from '../../helpers/utils/theme';

export const initialAppState = {
  theme: 'os',
  language: 'en',
  metametricsOptIn: false,
  isMetametricsOptionSelected: false,
  preferredStartup: 'minimized',
};

// Actions
export const UPDATE_THEME = 'UPDATE_THEME';
export const UPDATE_LANGUAGE = 'UPDATE_LANGUAGE';
export const UPDATE_METAMETRICS_OPT_IN = 'UPDATE_METAMETRICS_OPT_IN';
export const UPDATE_PREFERRED_STARTUP = 'UPDATE_PREFFERED_STARTUP';

// Reducer
/**
 *
 * @param state
 * @param action
 */
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
        isMetametricsOptionSelected: true,
      };
    }

    case UPDATE_PREFERRED_STARTUP: {
      window.electronBridge.setPreferredStartup(action.payload);
      return {
        ...state,
        preferredStartup: action.payload,
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
export const getPreferredStartup = (state) => state.app.preferredStartup;

// Action Creators
/**
 *
 * @param payload
 */
export function updateTheme(payload) {
  return { type: UPDATE_THEME, payload };
}

/**
 *
 * @param payload
 */
export function updateLanguage(payload) {
  return { type: UPDATE_LANGUAGE, payload };
}

/**
 *
 * @param payload
 */
export function updateMetametricsOptIn(payload) {
  return { type: UPDATE_METAMETRICS_OPT_IN, payload };
}

/**
 *
 * @param payload
 */
export function updatePreferredStartup(payload) {
  return { type: UPDATE_PREFERRED_STARTUP, payload };
}
