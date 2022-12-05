import { locales } from '../../locales';
import { UPDATE_LANGUAGE } from '../app/app';

export const initialLocalesState = {
  // Set the default locale to English temporarily
  current: locales.en,
  ...locales,
};

// Reducer
export default function localesReducer(state = initialLocalesState, action) {
  switch (action.type) {
    case UPDATE_LANGUAGE: {
      return {
        ...state,
        current: { ...locales[action.payload] },
      };
    }
    default:
      return state;
  }
}

// Selectors
export const getCurrentLocales = (state) => state.locales.current;
export const getEnLocales = (state) => state.locales.en;
