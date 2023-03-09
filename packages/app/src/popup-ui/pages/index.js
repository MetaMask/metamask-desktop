import React, { PureComponent } from 'react';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import PropTypes from 'prop-types';

import {
  I18nProvider as ExtensionI18nProvider,
  LegacyI18nProvider,
} from '../../../submodules/extension/ui/contexts/i18n';
import {
  MetaMetricsProvider,
  LegacyMetaMetricsProvider,
} from '../../../submodules/extension/ui/contexts/metametrics';
import Routes from './routes';
import ErrorBoundary from './error-boundary';

class Root extends PureComponent {
  state = {};

  render() {
    const { store } = this.props;

    return (
      <Provider store={store}>
        <HashRouter>
          <ErrorBoundary>
            <MetaMetricsProvider>
              <LegacyMetaMetricsProvider>
                <ExtensionI18nProvider>
                  <LegacyI18nProvider>
                    <Routes />
                  </LegacyI18nProvider>
                </ExtensionI18nProvider>
              </LegacyMetaMetricsProvider>
            </MetaMetricsProvider>
          </ErrorBoundary>
        </HashRouter>
      </Provider>
    );
  }
}

Root.propTypes = {
  /**
   * Redux store
   */
  store: PropTypes.any,
};

export default Root;
