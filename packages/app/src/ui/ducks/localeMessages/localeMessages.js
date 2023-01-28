import en from '../../../submodules/extension/app/_locales/en/messages.json';

export const initialState = {
  currentLocale: 'en',
  current: en,
  en,
};

// Reducer
export default function localeMessagesReducer(state = initialState, action) {
  switch (action.type) {
    default:
      return state;
  }
}
