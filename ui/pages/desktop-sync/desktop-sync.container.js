import { connect } from 'react-redux';
import {
  displayWarning,
  requestRevealSeedWords,
  fetchInfoToSync,
  exportAccounts,
  hideWarning,
  setOtp,
  startPairing,
} from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import {
  getIsPairing,
  // getOtp,
} from '../../selectors/selectors';
import DesktopSyncPage from './desktop-sync.component';

const mapDispatchToProps = (dispatch) => {
  return {
    requestRevealSeedWords: (password) =>
      dispatch(requestRevealSeedWords(password)),
    fetchInfoToSync: () => dispatch(fetchInfoToSync()),
    displayWarning: (message) => dispatch(displayWarning(message || null)),
    exportAccounts: (password, addresses) =>
      dispatch(exportAccounts(password, addresses)),
    hideWarning: () => dispatch(hideWarning()),
    setOtp: () => dispatch(setOtp()),
    startPairing: (val) => dispatch(startPairing(val)),
  };
};

const mapStateToProps = (state) => {
  const {
    metamask: { selectedAddress },
  } = state;

  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    selectedAddress,
    // otp: getOtp(state),
    isPairing: getIsPairing(state),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DesktopSyncPage);
