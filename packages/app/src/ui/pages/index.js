import React, { PureComponent } from 'react';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import PropTypes from 'prop-types';

import * as Sentry from '@sentry/electron/renderer';
import { I18nProvider } from '../contexts/i18n';
import { EVENT_NAMES } from '../../app/metrics/metrics-constants';
import Routes from './routes';
import CriticalError from './error/critical-error.component';

class Root extends PureComponent {
  state = {};

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    Sentry.captureException(error);
    window.electronBridge.track(EVENT_NAMES.UI_CRITICAL_ERROR);
    console.error('Exception Error Page', error);
  }

  render() {
    const { store, persistor } = this.props;
    const { error } = this.state;

    if (error) {
      return (
        <Provider store={store}>
          <I18nProvider>
            <CriticalError error={error} />
          </I18nProvider>
        </Provider>
      );
    }

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
  }
}

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
