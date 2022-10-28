import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { persistStore } from 'redux-persist';

import persistedRootReducer from '../ducks';

export default function configureStore(initialState = {}) {
  const storeEnhancers = applyMiddleware(thunkMiddleware);
  const store = createStore(persistedRootReducer, initialState, storeEnhancers);
  const persistor = persistStore(store);
  return { store, persistor };
}
