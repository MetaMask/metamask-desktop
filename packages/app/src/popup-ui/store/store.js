import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import rootReducer from '../ducks';

export default function configureStore(initialState = {}) {
  const storeEnhancers = applyMiddleware(thunkMiddleware);
  const store = createStore(rootReducer, initialState, storeEnhancers);
  return { store };
}
