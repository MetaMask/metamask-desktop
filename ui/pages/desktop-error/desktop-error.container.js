import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import DesktopError from './desktop-error.component';

const mapStateToProps = () => ({});
const mapDispatchToProps = () => ({});

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(DesktopError);
