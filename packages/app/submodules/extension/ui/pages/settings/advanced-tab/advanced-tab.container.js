import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  displayWarning,
  setFeatureFlag,
  showModal,
  setShowFiatConversionOnTestnetsPreference,
  setShowTestNetworks,
  setAutoLockTimeLimit,
  setUseNonceField,
  setIpfsGateway,
  setLedgerTransportPreference,
  setDismissSeedBackUpReminder,
  setUseTokenDetection,
  backupUserData,
  restoreUserData,
} from '../../../store/actions';
import { getPreferences } from '../../../selectors';
import { doesUserHaveALedgerAccount } from '../../../ducks/metamask/metamask';
import AdvancedTab from './advanced-tab.component';

export const mapStateToProps = (state) => {
  const {
    appState: { warning },
    metamask,
  } = state;
  const {
    featureFlags: { sendHexData, advancedInlineGas } = {},
    useNonceField,
    ipfsGateway,
    ledgerTransportType,
    dismissSeedBackUpReminder,
    useTokenDetection,
  } = metamask;
  const {
    showFiatInTestnets,
    showTestNetworks,
    autoLockTimeLimit = 0,
  } = getPreferences(state);

  const userHasALedgerAccount = doesUserHaveALedgerAccount(state);

  return {
    warning,
    sendHexData,
    advancedInlineGas,
    showFiatInTestnets,
    showTestNetworks,
    autoLockTimeLimit,
    useNonceField,
    ipfsGateway,
    ledgerTransportType,
    dismissSeedBackUpReminder,
    userHasALedgerAccount,
    useTokenDetection,
  };
};

export const mapDispatchToProps = (dispatch) => {
  return {
    backupUserData: () => backupUserData(),
    restoreUserData: (jsonString) => restoreUserData(jsonString),
    setHexDataFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('sendHexData', shouldShow)),
    displayWarning: (warning) => dispatch(displayWarning(warning)),
    showResetAccountConfirmationModal: () =>
      dispatch(showModal({ name: 'CONFIRM_RESET_ACCOUNT' })),
    setAdvancedInlineGasFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('advancedInlineGas', shouldShow)),
    setUseNonceField: (value) => dispatch(setUseNonceField(value)),
    setShowFiatConversionOnTestnetsPreference: (value) => {
      return dispatch(setShowFiatConversionOnTestnetsPreference(value));
    },
    setShowTestNetworks: (value) => {
      return dispatch(setShowTestNetworks(value));
    },
    setAutoLockTimeLimit: (value) => {
      return dispatch(setAutoLockTimeLimit(value));
    },
    setIpfsGateway: (value) => {
      return dispatch(setIpfsGateway(value));
    },
    setLedgerTransportPreference: (value) => {
      return dispatch(setLedgerTransportPreference(value));
    },
    setDismissSeedBackUpReminder: (value) => {
      return dispatch(setDismissSeedBackUpReminder(value));
    },
    setUseTokenDetection: (value) => {
      return dispatch(setUseTokenDetection(value));
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AdvancedTab);
