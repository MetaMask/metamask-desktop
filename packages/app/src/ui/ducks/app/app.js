import setTheme from '../../helpers/theme';
import * as windowConstants from '../../../shared/constants/window';

export const initialAppState = {
  theme: 'os',
  language: 'en',
  metametricsOptIn: false,
  isDesktopPopupEnabled: false,
  isMetametricsOptionSelected: false,
  preferredStartup: 'minimized',
  window: {
    width: windowConstants.DEFAULT_WINDOW_WIDTH,
    height: windowConstants.DEFAULT_WINDOW_HEIGHT,
    x: undefined,
    y: undefined,
  },
};

// Actions
export const UPDATE_THEME = 'UPDATE_THEME';
export const UPDATE_LANGUAGE = 'UPDATE_LANGUAGE';
export const UPDATE_METAMETRICS_OPT_IN = 'UPDATE_METAMETRICS_OPT_IN';
export const UPDATE_PREFERRED_STARTUP = 'UPDATE_PREFFERED_STARTUP';
export const UPDATE_WINDOW_SIZE = 'UPDATE_WINDOW_SIZE';
export const UPDATE_WINDOW_POSITION = 'UPDATE_WINDOW_POSITION';
export const UPDATE_DESKTOP_POPUP_ENABLED = 'UPDATE_DESKTOP_POPUP_ENABLED';

// Reducer
export default function appReducer(state = initialAppState, action) {
  switch (action.type) {
    case UPDATE_THEME: {
      setTheme(action.payload);
      window.electronBridge.syncTheme(action.payload);
      return {
        ...state,
        theme: action.payload,
      };
    }

    case UPDATE_LANGUAGE: {
      window.electronBridge.setLanguage(action.payload);
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

    case UPDATE_WINDOW_SIZE: {
      return {
        ...state,
        window: {
          ...state.window,
          ...action.size,
        },
      };
    }

    case UPDATE_WINDOW_POSITION: {
      return {
        ...state,
        window: {
          ...state.window,
          ...action.position,
        },
      };
    }

    case UPDATE_DESKTOP_POPUP_ENABLED: {
      window.electronBridge.toggleDesktopPopup(action.isEnabled);
      return {
        ...state,
        isDesktopPopupEnabled: action.isEnabled,
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
export const getDesktopPopupEnabled = (state) =>
  state.app.isDesktopPopupEnabled;

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

export function updatePreferredStartup(payload) {
  return { type: UPDATE_PREFERRED_STARTUP, payload };
}

export function updateWindowSize(size) {
  return { type: UPDATE_WINDOW_SIZE, size };
}

export function updateWindowPosition(position) {
  return { type: UPDATE_WINDOW_POSITION, position };
}

export function updateDesktopPopupEnabled(isEnabled) {
  return { type: UPDATE_DESKTOP_POPUP_ENABLED, isEnabled };
}
