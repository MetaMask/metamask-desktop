import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import { getTheme } from '../../ducks/app/app';
import Routes from './routes.component';

function mapStateToProps(state) {
  return {
    theme: getTheme(state),
  };
}

export default compose(withRouter, connect(mapStateToProps))(Routes);
