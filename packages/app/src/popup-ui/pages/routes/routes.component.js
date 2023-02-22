import React, { useEffect, useState } from 'react';
import { PropTypes } from 'prop-types';
import { Route, Switch, useHistory, Redirect } from 'react-router-dom';

import { CONFIRMATION_ROUTE } from '../../../shared/constants/ui-routes';
import Confirmation from '../../../../submodules/extension/ui/pages/confirmation';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONNECT_ROUTE,
  DEFAULT_ROUTE,
} from '../../../../submodules/extension/ui/helpers/constants/routes';
import PermissionsConnect from '../../../../submodules/extension/ui/pages/permissions-connect';
import ConfirmTransaction from '../../../../submodules/extension/ui/pages/confirm-transaction';
import Loading from '../loading';

const Routes = ({
  hasPendingApproval,
  hasPendingPermissionApproval,
  hasPendingTransactionApproval,
  permissionRequestId,
}) => {
  const history = useHistory();
  const [isApproving, setApproving] = useState(false);

  useEffect(() => {
    let requiredRoute;

    if (hasPendingPermissionApproval) {
      requiredRoute = `${CONNECT_ROUTE}/${permissionRequestId}`;
    } else if (hasPendingTransactionApproval) {
      requiredRoute = CONFIRM_TRANSACTION_ROUTE;
    } else if (hasPendingApproval) {
      requiredRoute = CONFIRMATION_ROUTE;
    }

    if (isApproving && !requiredRoute) {
      setApproving(false);
      history.push(DEFAULT_ROUTE);
    }

    if (!isApproving && requiredRoute) {
      history.push(requiredRoute);
      setApproving(true);
    }
  }, [
    hasPendingPermissionApproval,
    hasPendingTransactionApproval,
    hasPendingApproval,
    permissionRequestId,
    isApproving,
    history,
  ]);

  return (
    <div
      id="mmd-popup-content"
    >
      <Switch>
        <Route path={DEFAULT_ROUTE} component={Loading} exact />
        <Route path={CONFIRMATION_ROUTE} component={Confirmation} exact />
        <Route path={`${CONNECT_ROUTE}/:id`} component={PermissionsConnect} />
        <Route
          path={`${CONFIRM_TRANSACTION_ROUTE}`}
          component={ConfirmTransaction}
        />
        <Redirect to="/" />
      </Switch>
    </div>
  );
};

Routes.propTypes = {
  hasPendingApproval: PropTypes.bool,
  hasPendingPermissionApproval: PropTypes.bool,
  hasPendingTransactionApproval: PropTypes.bool,
  permissionRequestId: PropTypes.string,
};

export default Routes;
