import React, { useEffect } from 'react';
import { PropTypes } from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import {
  SETTINGS_ROUTE,
  PAIR_ROUTE,
  ERROR_ROUTE,
  SUCCESSFUL_PAIR_ROUTE,
} from '../../helpers/constants/routes';
import setTheme from '../../helpers/utils/theme';
import Pair from '../pair';
import SuccessfulPair from '../successful-pair';
import Settings from '../settings';
import ErrorPage from '../error';
import useDeeplinkRegister from '../../hooks/useDeeplinkRegister';

const Routes = ({ theme }) => {
  useDeeplinkRegister();
  useEffect(() => {
    // Set theme (html attr) for the first time
    setTheme(theme);
  }, []);

  return (
    <div id="mmd-app-content">
      <Switch>
        <Route path={PAIR_ROUTE} component={Pair} />
        <Route path={SUCCESSFUL_PAIR_ROUTE} component={SuccessfulPair} />
        <Route path={SETTINGS_ROUTE} component={Settings} />
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
