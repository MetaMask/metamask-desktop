import React, { useEffect, useState } from 'react';
import { PropTypes } from 'prop-types';
import { Route, Switch, useHistory, Redirect } from 'react-router-dom';

import {
  SETTINGS_ROUTE,
  PAIR_ROUTE,
  ERROR_ROUTE,
  SUCCESSFUL_PAIR_ROUTE,
  METAMETRICS_OPT_IN_ROUTE,
  CONFIRMATION_ROUTE,
} from '../../../shared/constants/ui-routes';
import setTheme from '../../helpers/theme';
import Pair from '../pair';
import SuccessfulPair from '../successful-pair';
import Settings from '../settings';
import ErrorPage from '../error';
import MetametricsOptInPage from '../metametrics-opt-in';
import useDeeplinkRegister from '../../hooks/useDeeplinkRegister';
import { EVENT_NAMES } from '../../../app/metrics/metrics-constants';
import Confirmation from '../../../submodules/extension/ui/pages/confirmation';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONNECT_ROUTE,
} from '../../../submodules/extension/ui/helpers/constants/routes';
import PermissionsConnect from '../../../submodules/extension/ui/pages/permissions-connect';
import ConfirmTransaction from '../../../submodules/extension/ui/pages/confirm-transaction';

const Routes = ({
  theme,
  pendingApprovals,
  firstPermissionsRequestId,
  unconfirmedTransactionsCount,
}) => {
  useDeeplinkRegister();
  useEffect(() => {
    // Set theme (html attr) for the first time
    setTheme(theme);
  }, [theme]);
  const history = useHistory();
  const [isApproving, setApproving] = useState(false);

  useEffect(() => {
    let requiredRoute;

    if (firstPermissionsRequestId) {
      requiredRoute = `${CONNECT_ROUTE}/${firstPermissionsRequestId}`;
    } else if (unconfirmedTransactionsCount > 0) {
      requiredRoute = CONFIRM_TRANSACTION_ROUTE;
    } else if (pendingApprovals.length > 0) {
      requiredRoute = CONFIRMATION_ROUTE;
    }

    if (isApproving && !requiredRoute) {
      setApproving(false);
      window.electronBridge.showApprovalWindow(false);
    }

    if (!isApproving && requiredRoute) {
      history.push(requiredRoute);
      setApproving(true);
      window.electronBridge.showApprovalWindow(true);
    }
  }, [
    pendingApprovals,
    firstPermissionsRequestId,
    unconfirmedTransactionsCount,
    isApproving,
    history,
  ]);

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
        <Route path={CONFIRMATION_ROUTE} component={Confirmation} exact />
        <Route path={`${CONNECT_ROUTE}/:id`} component={PermissionsConnect} />
        <Route
          path={`${CONFIRM_TRANSACTION_ROUTE}`}
          component={ConfirmTransaction}
        />
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
  pendingApprovals: PropTypes.any,
  firstPermissionsRequestId: PropTypes.string,
  unconfirmedTransactionsCount: PropTypes.number,
};

export default Routes;
