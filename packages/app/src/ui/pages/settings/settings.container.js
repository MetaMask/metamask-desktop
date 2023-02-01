import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import { ABOUT_US_ROUTE, PRIVACY_ROUTE } from '../../helpers/constants/routes';
import Settings from './settings.component';

function mapStateToProps(_, ownProps) {
  const {
    location: { pathname },
  } = ownProps;
  return {
    currentPath: pathname,
    isAboutPage: pathname === ABOUT_US_ROUTE,
    isPrivacyPage: pathname === PRIVACY_ROUTE,
  };
}

export default compose(withRouter, connect(mapStateToProps))(Settings);
