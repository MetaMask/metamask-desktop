import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
///: BEGIN:ONLY_INCLUDE_IN(flask,desktopextension,desktopapp)
import { getUnreadNotificationsCount } from '../../../selectors';
///: END:ONLY_INCLUDE_IN

import * as actions from '../../../store/actions';
import AppHeader from './app-header.component';

const mapStateToProps = (state) => {
  const { appState, metamask } = state;
  const { networkDropdownOpen } = appState;
  const { selectedAddress, isUnlocked, isAccountMenuOpen, desktopEnabled } =
    metamask;

  ///: BEGIN:ONLY_INCLUDE_IN(flask,desktopextension,desktopapp)
  const unreadNotificationsCount = getUnreadNotificationsCount(state);
  ///: END:ONLY_INCLUDE_IN

  return {
    networkDropdownOpen,
    selectedAddress,
    isUnlocked,
    isAccountMenuOpen,
    ///: BEGIN:ONLY_INCLUDE_IN(flask,desktopextension,desktopapp)
    unreadNotificationsCount,
    ///: END:ONLY_INCLUDE_IN
    desktopEnabled,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    showNetworkDropdown: () => dispatch(actions.showNetworkDropdown()),
    hideNetworkDropdown: () => dispatch(actions.hideNetworkDropdown()),
    toggleAccountMenu: () => dispatch(actions.toggleAccountMenu()),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AppHeader);
