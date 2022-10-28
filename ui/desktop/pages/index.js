import React from 'react';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import PropTypes from 'prop-types';

import { I18nProvider } from '../contexts/i18n';
import Routes from './routes';

const Root = ({ store, persistor }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <HashRouter>
          <I18nProvider>
            <Routes />
          </I18nProvider>
        </HashRouter>
      </PersistGate>
    </Provider>
  );
};

Root.propTypes = {
  /**
   * Redux store
   */
  store: PropTypes.any,
  /**
   * Redux store persistor
   */
  persistor: PropTypes.any,
};

export default Root;
