import React, { useEffect } from 'react';
import { PropTypes } from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import {
  SETTINGS_ROUTE,
  PAIR_ROUTE,
  ERROR_ROUTE,
  SUCCESSFUL_PAIR_ROUTE,
  METAMETRICS_OPT_IN_ROUTE,
} from '../../../shared/constants/ui-routes';
import setTheme from '../../helpers/theme';
import Pair from '../pair';
import SuccessfulPair from '../successful-pair';
import Settings from '../settings';
import ErrorPage from '../error';
import MetametricsOptInPage from '../metametrics-opt-in';
import useDeeplinkRegister from '../../hooks/useDeeplinkRegister';
import { EVENT_NAMES } from '../../../app/metrics/metrics-constants';

const Routes = ({ theme }) => {
  useDeeplinkRegister();
  useEffect(() => {
    // Set theme (html attr) for the first time
    setTheme(theme);
  }, [theme]);

  useEffect(() => {
    window.electronBridge.track(EVENT_NAMES.DESKTOP_UI_LOADED);
  }, []);

  return (
    <div id="mmd-app-content">
      <Switch>
        <Route path={PAIR_ROUTE} component={Pair} />
        <Route path={SUCCESSFUL_PAIR_ROUTE} component={SuccessfulPair} />
        <Route path={SETTINGS_ROUTE} component={Settings} />
        <Route
          path={METAMETRICS_OPT_IN_ROUTE}
          component={MetametricsOptInPage}
        />
        <Route path={`${ERROR_ROUTE}/:errorType`} component={ErrorPage} exact />
        <Route
          path="*"
          render={() => <ErrorPage errorType="route-not-found" />}
        />
      </Switch>
    </div>
  );
};

Routes.propTypes = {
  /**
   * Theme name from app state
   */
  theme: PropTypes.string,
};

export default Routes;
