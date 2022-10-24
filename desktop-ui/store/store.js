import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';

import createElectronStorage from '../helpers/utils/electron-storage';
import rootReducer from '../ducks';

const persistConfig = {
  key: 'root',
  storage: createElectronStorage({
    // Change the number to clear the storage
    name: 'mmd-desktop-ui-v0.0.3',
  }),
  whitelist: ['app', 'locales'],
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

export default function configureStore(initialState = {}) {
  const storeEnhancers = applyMiddleware(thunkMiddleware);
  const store = createStore(persistedReducer, initialState, storeEnhancers);
  const persistor = persistStore(store);
  return { store, persistor };
}
