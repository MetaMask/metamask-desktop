import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { disableDesktop } from '../../store/actions';
import DesktopError from './desktop-error.component';

const mapStateToProps = () => ({});

const mapDispatchToProps = (dispatch) => ({
  disableDesktop: () => dispatch(disableDesktop()),
});

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(DesktopError);
