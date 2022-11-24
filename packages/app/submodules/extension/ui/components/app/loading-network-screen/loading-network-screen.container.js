import { connect } from 'react-redux';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import * as actions from '../../../store/actions';
import { getNetworkIdentifier, isNetworkLoading } from '../../../selectors';
import LoadingNetworkScreen from './loading-network-screen.component';

const DEPRECATED_TEST_NET_CHAINIDS = ['0x3', '0x2a', '0x4'];

const mapStateToProps = (state) => {
  const { loadingMessage } = state.appState;
  const { provider } = state.metamask;
  const { rpcUrl, chainId, ticker, nickname, type } = provider;

  const setProviderArgs =
    type === NETWORK_TYPES.RPC
      ? [rpcUrl, chainId, ticker, nickname]
      : [provider.type];

  const providerChainId = provider?.chainId;
  const isDeprecatedNetwork =
    DEPRECATED_TEST_NET_CHAINIDS.includes(providerChainId);
  const isInfuraRpcUrl = provider?.rpcUrl?.match('infura');
  const showDeprecatedRpcUrlWarning = isDeprecatedNetwork && isInfuraRpcUrl;

  return {
    isNetworkLoading: isNetworkLoading(state),
    loadingMessage,
    setProviderArgs,
    provider,
    providerId: getNetworkIdentifier(state),
    showDeprecatedRpcUrlWarning,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setProviderType: (type) => {
      dispatch(actions.setProviderType(type));
    },
    rollbackToPreviousProvider: () =>
      dispatch(actions.rollbackToPreviousProvider()),
    showNetworkDropdown: () => dispatch(actions.showNetworkDropdown()),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LoadingNetworkScreen);
