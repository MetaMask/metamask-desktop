import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route } from 'react-router-dom';
import Loading from '../../components/ui/loading-screen';
import ConfirmTransactionSwitch from '../confirm-transaction-switch';
import ConfirmContractInteraction from '../confirm-contract-interaction';
import ConfirmSendEther from '../confirm-send-ether';
import ConfirmDeployContract from '../confirm-deploy-contract';
import ConfirmDecryptMessage from '../confirm-decrypt-message';
import ConfirmEncryptionPublicKey from '../confirm-encryption-public-key';

import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_DEPLOY_CONTRACT_PATH,
  CONFIRM_SEND_ETHER_PATH,
  CONFIRM_TOKEN_METHOD_PATH,
  SIGNATURE_REQUEST_PATH,
  DECRYPT_MESSAGE_REQUEST_PATH,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  disconnectGasFeeEstimatePoller,
  getGasFeeEstimatesAndStartPolling,
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
} from '../../store/actions';
import ConfirmTokenTransactionSwitch from './confirm-token-transaction-switch';
import ConfTx from './conf-tx';

export default class ConfirmTransaction extends Component {
  static contextTypes = {
    metricsEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object.isRequired,
    totalUnapprovedCount: PropTypes.number.isRequired,
    sendTo: PropTypes.string,
    setTransactionToConfirm: PropTypes.func,
    clearConfirmTransaction: PropTypes.func,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    transaction: PropTypes.object,
    getContractMethodData: PropTypes.func,
    transactionId: PropTypes.string,
    paramsTransactionId: PropTypes.string,
    isTokenMethodAction: PropTypes.bool,
    setDefaultHomeActiveTabName: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  _beforeUnload = () => {
    this._isMounted = false;
    if (this.state.pollingToken) {
      disconnectGasFeeEstimatePoller(this.state.pollingToken);
      removePollingTokenFromAppState(this.state.pollingToken);
    }
  };

  componentDidMount() {
    this._isMounted = true;
    const {
      totalUnapprovedCount = 0,
      sendTo,
      history,
      mostRecentOverviewPage,
      transaction: { txParams: { data } = {}, origin } = {},
      getContractMethodData,
      transactionId,
      paramsTransactionId,
    } = this.props;

    getGasFeeEstimatesAndStartPolling().then((pollingToken) => {
      if (this._isMounted) {
        this.setState({ pollingToken });
        addPollingTokenToAppState(pollingToken);
      } else {
        disconnectGasFeeEstimatePoller(pollingToken);
        removePollingTokenFromAppState(pollingToken);
      }
    });

    window.addEventListener('beforeunload', this._beforeUnload);

    if (!totalUnapprovedCount && !sendTo) {
      history.replace(mostRecentOverviewPage);
      return;
    }

    if (origin !== 'metamask') {
      getContractMethodData(data);
    }

    const txId = transactionId || paramsTransactionId;
    if (txId) {
      this.props.setTransactionToConfirm(txId);
    }
  }

  componentWillUnmount() {
    this._beforeUnload();
    window.removeEventListener('beforeunload', this._beforeUnload);
  }

  componentDidUpdate(prevProps) {
    const {
      setTransactionToConfirm,
      transaction: { txData: { txParams: { data } = {}, origin } = {} },
      clearConfirmTransaction,
      getContractMethodData,
      paramsTransactionId,
      transactionId,
      history,
      mostRecentOverviewPage,
      totalUnapprovedCount,
      setDefaultHomeActiveTabName,
    } = this.props;

    if (
      paramsTransactionId &&
      transactionId &&
      prevProps.paramsTransactionId !== paramsTransactionId
    ) {
      clearConfirmTransaction();
      setTransactionToConfirm(paramsTransactionId);
      if (origin !== 'metamask') {
        getContractMethodData(data);
      }
    } else if (
      prevProps.transactionId &&
      !transactionId &&
      !totalUnapprovedCount
    ) {
      setDefaultHomeActiveTabName('Activity').then(() => {
        history.replace(DEFAULT_ROUTE);
      });
    } else if (
      prevProps.transactionId &&
      transactionId &&
      prevProps.transactionId !== transactionId
    ) {
      history.replace(mostRecentOverviewPage);
    }
  }

  render() {
    const {
      transactionId,
      paramsTransactionId,
      isTokenMethodAction,
      transaction,
    } = this.props;

    const validTransactionId =
      transactionId &&
      (!paramsTransactionId || paramsTransactionId === transactionId);

    if (isTokenMethodAction && validTransactionId) {
      return <ConfirmTokenTransactionSwitch transaction={transaction} />;
    }
    // Show routes when state.confirmTransaction has been set and when either the ID in the params
    // isn't specified or is specified and matches the ID in state.confirmTransaction in order to
    // support URLs of /confirm-transaction or /confirm-transaction/<transactionId>
    return validTransactionId ? (
      <Switch>
        <Route
          exact
          path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_DEPLOY_CONTRACT_PATH}`}
          component={ConfirmDeployContract}
        />
        <Route
          exact
          path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_SEND_ETHER_PATH}`}
          component={ConfirmSendEther}
        />
        <Route
          exact
          path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_TOKEN_METHOD_PATH}`}
          component={ConfirmContractInteraction}
        />
        <Route
          exact
          path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${SIGNATURE_REQUEST_PATH}`}
          component={ConfTx}
        />
        <Route
          exact
          path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${DECRYPT_MESSAGE_REQUEST_PATH}`}
          component={ConfirmDecryptMessage}
        />
        <Route
          exact
          path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`}
          component={ConfirmEncryptionPublicKey}
        />
        <Route path="*" component={ConfirmTransactionSwitch} />
      </Switch>
    ) : (
      <Loading />
    );
  }
}
