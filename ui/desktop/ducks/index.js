import { combineReducers } from 'redux';
import appReducer from './app/app';
import localesReducer from './locale/locale';
import pairStatusReducer from './pair-status/pair-status';

export default combineReducers({
  app: appReducer,
  locales: localesReducer,
  pairStatus: pairStatusReducer,
});
