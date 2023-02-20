import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

export default function configureStore(initialState = {}) {
  const storeEnhancers = applyMiddleware(thunkMiddleware);
  const store = createStore(initialState, storeEnhancers);
  return { store };
}
