import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import Button from '../../ui/button';
import * as actions from '../../../store/actions';
import { openAlert as displayInvalidCustomNetworkAlert } from '../../../ducks/alerts/invalid-custom-network';
import {
  LOCALHOST_RPC_URL,
  NETWORK_TYPES,
} from '../../../../shared/constants/network';
import { isPrefixedFormattedHexString } from '../../../../shared/modules/network.utils';

import ColorIndicator from '../../ui/color-indicator';
import { COLORS, SIZES } from '../../../helpers/constants/design-system';
import { getShowTestNetworks } from '../../../selectors';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import {
  ADD_POPULAR_CUSTOM_NETWORK,
  ADVANCED_ROUTE,
} from '../../../helpers/constants/routes';
import IconCheck from '../../ui/icon/icon-check';

import { Dropdown, DropdownMenuItem } from './dropdown';

// classes from nodes of the toggle element.
const notToggleElementClassnames = [
  'menu-icon',
  'network-name',
  'network-indicator',
  'network-caret',
  'network-component',
  'modal-container__footer-button',
];

const DROP_DOWN_MENU_ITEM_STYLE = {
  fontSize: '16px',
  lineHeight: '20px',
  padding: '16px',
};

function mapStateToProps(state) {
  return {
    provider: state.metamask.provider,
    shouldShowTestNetworks: getShowTestNetworks(state),
    frequentRpcListDetail: state.metamask.frequentRpcListDetail || [],
    networkDropdownOpen: state.appState.networkDropdownOpen,
    showTestnetMessageInDropdown: state.metamask.showTestnetMessageInDropdown,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setProviderType: (type) => {
      dispatch(actions.setProviderType(type));
    },
    setRpcTarget: (target, chainId, ticker, nickname) => {
      dispatch(actions.setRpcTarget(target, chainId, ticker, nickname));
    },
    hideNetworkDropdown: () => dispatch(actions.hideNetworkDropdown()),
    displayInvalidCustomNetworkAlert: (networkName) => {
      dispatch(displayInvalidCustomNetworkAlert(networkName));
    },
    showConfirmDeleteNetworkModal: ({ target, onConfirm }) => {
      return dispatch(
        actions.showModal({
          name: 'CONFIRM_DELETE_NETWORK',
          target,
          onConfirm,
        }),
      );
    },
    hideTestNetMessage: () => actions.hideTestNetMessage(),
  };
}

class NetworkDropdown extends Component {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    provider: PropTypes.shape({
      nickname: PropTypes.string,
      rpcUrl: PropTypes.string,
      type: PropTypes.string,
      ticker: PropTypes.string,
    }).isRequired,
    setProviderType: PropTypes.func.isRequired,
    setRpcTarget: PropTypes.func.isRequired,
    hideNetworkDropdown: PropTypes.func.isRequired,
    frequentRpcListDetail: PropTypes.array.isRequired,
    shouldShowTestNetworks: PropTypes.bool,
    networkDropdownOpen: PropTypes.bool.isRequired,
    displayInvalidCustomNetworkAlert: PropTypes.func.isRequired,
    showConfirmDeleteNetworkModal: PropTypes.func.isRequired,
    showTestnetMessageInDropdown: PropTypes.bool.isRequired,
    hideTestNetMessage: PropTypes.func.isRequired,
    history: PropTypes.object,
  };

  handleClick(newProviderType) {
    const {
      provider: { type: providerType },
      setProviderType,
    } = this.props;
    const { trackEvent } = this.context;

    trackEvent({
      category: EVENT.CATEGORIES.NAVIGATION,
      event: EVENT_NAMES.NAV_NETWORK_SWITCHED,
      properties: {
        from_network: providerType,
        to_network: newProviderType,
      },
    });
    setProviderType(newProviderType);
  }

  renderAddCustomButton() {
    return (
      <div className="network__add-network-button">
        <Button
          type="secondary"
          onClick={() => {
            getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
              ? global.platform.openExtensionInBrowser(
                  ADD_POPULAR_CUSTOM_NETWORK,
                )
              : this.props.history.push(ADD_POPULAR_CUSTOM_NETWORK);
            this.props.hideNetworkDropdown();
          }}
        >
          {this.context.t('addNetwork')}
        </Button>
      </div>
    );
  }

  renderCustomRpcList(rpcListDetail, provider, opts = {}) {
    const reversedRpcListDetail = rpcListDetail.slice().reverse();

    return reversedRpcListDetail.map((entry) => {
      const { rpcUrl, chainId, ticker = 'ETH', nickname = '' } = entry;
      const isCurrentRpcTarget =
        provider.type === NETWORK_TYPES.RPC && rpcUrl === provider.rpcUrl;

      return (
        <DropdownMenuItem
          key={`common${rpcUrl}`}
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => {
            if (isPrefixedFormattedHexString(chainId)) {
              this.props.setRpcTarget(rpcUrl, chainId, ticker, nickname);
            } else {
              this.props.displayInvalidCustomNetworkAlert(nickname || rpcUrl);
            }
          }}
          style={{
            fontSize: '16px',
            lineHeight: '20px',
            padding: '16px',
          }}
        >
          {isCurrentRpcTarget ? (
            <IconCheck color="var(--color-success-default)" />
          ) : (
            <div className="network-check__transparent">✓</div>
          )}
          <ColorIndicator
            color={opts.isLocalHost ? 'localhost' : COLORS.ICON_MUTED}
            size={SIZES.LG}
            type={ColorIndicator.TYPES.FILLED}
          />
          <span
            className="network-name-item"
            data-testid={`${nickname}-network-item`}
            style={{
              color: isCurrentRpcTarget
                ? 'var(--color-text-default)'
                : 'var(--color-text-alternative)',
            }}
          >
            {nickname || rpcUrl}
          </span>
          {isCurrentRpcTarget ? null : (
            <i
              className="fa fa-times delete"
              onClick={(e) => {
                e.stopPropagation();
                this.props.showConfirmDeleteNetworkModal({
                  target: rpcUrl,
                  onConfirm: () => undefined,
                });
              }}
            />
          )}
        </DropdownMenuItem>
      );
    });
  }

  getNetworkName() {
    const { provider } = this.props;
    const providerName = provider.type;
    const { t } = this.context;

    switch (providerName) {
      case NETWORK_TYPES.MAINNET:
        return t('mainnet');
      case NETWORK_TYPES.GOERLI:
        return t('goerli');
      case NETWORK_TYPES.SEPOLIA:
        return t('sepolia');
      case NETWORK_TYPES.LOCALHOST:
        return t('localhost');
      default:
        return provider.nickname || t('unknownNetwork');
    }
  }

  renderNetworkEntry(network) {
    const {
      provider: { type: providerType },
    } = this.props;
    return (
      <DropdownMenuItem
        key={network}
        closeMenu={this.props.hideNetworkDropdown}
        onClick={() => this.handleClick(network)}
        style={DROP_DOWN_MENU_ITEM_STYLE}
      >
        {providerType === network ? (
          <IconCheck color="var(--color-success-default)" />
        ) : (
          <div className="network-check__transparent">✓</div>
        )}
        <ColorIndicator
          color={network}
          size={SIZES.LG}
          type={ColorIndicator.TYPES.FILLED}
        />
        <span
          className="network-name-item"
          data-testid={`${network}-network-item`}
          style={{
            color:
              providerType === network
                ? 'var(--color-text-default)'
                : 'var(--color-text-alternative)',
          }}
        >
          {this.context.t(network)}
        </span>
      </DropdownMenuItem>
    );
  }

  render() {
    const {
      history,
      hideNetworkDropdown,
      shouldShowTestNetworks,
      showTestnetMessageInDropdown,
      hideTestNetMessage,
    } = this.props;
    const rpcListDetail = this.props.frequentRpcListDetail;
    const rpcListDetailWithoutLocalHost = rpcListDetail.filter(
      (rpc) => rpc.rpcUrl !== LOCALHOST_RPC_URL,
    );
    const rpcListDetailForLocalHost = rpcListDetail.filter(
      (rpc) => rpc.rpcUrl === LOCALHOST_RPC_URL,
    );
    const isOpen = this.props.networkDropdownOpen;
    const { t } = this.context;

    return (
      <Dropdown
        isOpen={isOpen}
        onClickOutside={(event) => {
          const { classList } = event.target;
          const isInClassList = (className) => classList.contains(className);
          const notToggleElementIndex =
            notToggleElementClassnames.findIndex(isInClassList);

          if (notToggleElementIndex === -1) {
            event.stopPropagation();
            hideNetworkDropdown();
          }
        }}
        containerClassName="network-droppo"
        zIndex={55}
        style={{
          position: 'absolute',
          top: '58px',
          width: '309px',
          zIndex: '55px',
        }}
        innerStyle={{
          padding: '16px 0',
        }}
      >
        <div className="network-dropdown-header">
          <div className="network-dropdown-title">{t('networks')}</div>
          <div className="network-dropdown-divider" />
          {showTestnetMessageInDropdown ? (
            <div className="network-dropdown-content">
              {t('toggleTestNetworks', [
                <a
                  href="#"
                  key="advancedSettingsLink"
                  className="network-dropdown-content--link"
                  onClick={(e) => {
                    e.preventDefault();
                    hideNetworkDropdown();
                    history.push(`${ADVANCED_ROUTE}#show-testnets`);
                  }}
                >
                  {t('showHide')}
                </a>,
              ])}
              <Button
                onClick={hideTestNetMessage}
                className="network-dropdown-content--dismiss"
              >
                {t('dismiss')}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="network-dropdown-list">
          {this.renderNetworkEntry(NETWORK_TYPES.MAINNET)}

          {this.renderCustomRpcList(
            rpcListDetailWithoutLocalHost,
            this.props.provider,
          )}

          {shouldShowTestNetworks && (
            <>
              {this.renderNetworkEntry(NETWORK_TYPES.GOERLI)}
              {this.renderNetworkEntry(NETWORK_TYPES.SEPOLIA)}
              {this.renderCustomRpcList(
                rpcListDetailForLocalHost,
                this.props.provider,
                { isLocalHost: true },
              )}
            </>
          )}
        </div>

        {this.renderAddCustomButton()}
      </Dropdown>
    );
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(NetworkDropdown);
