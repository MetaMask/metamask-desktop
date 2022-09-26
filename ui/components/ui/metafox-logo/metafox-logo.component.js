import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import MetaFoxHorizontalLogo from './horizontal-logo';

export default class MetaFoxLogo extends PureComponent {
  static propTypes = {
    onClick: PropTypes.func,
    unsetIconHeight: PropTypes.bool,
    isOnboarding: PropTypes.bool,
    src: PropTypes.string,
  };

  static defaultProps = {
    onClick: undefined,
  };

  render() {
    const { onClick, unsetIconHeight, isOnboarding, src } = this.props;
    const iconProps = unsetIconHeight ? {} : { height: 42, width: 42 };

    return (
      <div
        onClick={onClick}
        className={classnames({
          'app-header__logo-container': !isOnboarding,
          'onboarding-app-header__logo-container': isOnboarding,
          'app-header__logo-container--clickable': Boolean(onClick),
        })}
        data-testid="app-header-logo"
      >
        {!src && (
          <MetaFoxHorizontalLogo
            className={classnames({
              'app-header__metafox-logo--horizontal': !isOnboarding,
              'onboarding-app-header__metafox-logo--horizontal': isOnboarding,
            })}
          />
        )}

        {src && (
          <img
            {...iconProps}
            src={src}
            className={classnames({
              'app-header__metafox-logo--horizontal': !isOnboarding,
              'onboarding-app-header__metafox-logo--horizontal': isOnboarding,
            })}
            alt=""
          />
        )}

        <img
          {...iconProps}
          src={src || './images/logo/metamask-fox.svg'}
          className={classnames({
            'app-header__metafox-logo--icon': !isOnboarding,
            'onboarding-app-header__metafox-logo--icon': isOnboarding,
          })}
          alt=""
        />
      </div>
    );
  }
}
