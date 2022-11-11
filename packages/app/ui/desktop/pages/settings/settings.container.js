import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import { getIsDesktopEnabled } from '../../ducks/pair-status/pair-status';
import { ABOUT_US_ROUTE } from '../../helpers/constants/routes';
import Settings from './settings.component';

function mapStateToProps(state, ownProps) {
  const {
    location: { pathname },
  } = ownProps;
  return {
    currentPath: pathname,
    isAboutPage: pathname === ABOUT_US_ROUTE,
    isDesktopEnabled: getIsDesktopEnabled(state),
  };
}

export default compose(withRouter, connect(mapStateToProps))(Settings);
