import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import { EVENT } from '../../../../shared/constants/metametrics';
import DesktopEnableButton from '../../../components/app/desktop-enable-button';

export default class ExperimentalTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    useCollectibleDetection: PropTypes.bool,
    setUseCollectibleDetection: PropTypes.func,
    setOpenSeaEnabled: PropTypes.func,
    openSeaEnabled: PropTypes.bool,
    eip1559V2Enabled: PropTypes.bool,
    setEIP1559V2Enabled: PropTypes.func,
    customNetworkListEnabled: PropTypes.bool,
    setCustomNetworkListEnabled: PropTypes.func,
  };

  settingsRefs = Array(
    getNumberOfSettingsInSection(
      this.context.t,
      this.context.t('experimental'),
    ),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef();
    });

  componentDidUpdate() {
    const { t } = this.context;
    handleSettingsRefs(t, t('experimental'), this.settingsRefs);
  }

  componentDidMount() {
    const { t } = this.context;
    handleSettingsRefs(t, t('experimental'), this.settingsRefs);
  }

  renderCollectibleDetectionToggle() {
    if (!process.env.COLLECTIBLES_V1) {
      return null;
    }

    const { t } = this.context;
    const {
      useCollectibleDetection,
      setUseCollectibleDetection,
      openSeaEnabled,
      setOpenSeaEnabled,
    } = this.props;

    return (
      <div
        ref={this.settingsRefs[2]}
        className="settings-page__content-row--dependent"
      >
        <div className="settings-page__content-item">
          <span>{t('useCollectibleDetection')}</span>
          <div className="settings-page__content-description">
            {t('useCollectibleDetectionDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useCollectibleDetection}
              onToggle={(value) => {
                this.context.trackEvent({
                  category: EVENT.CATEGORIES.SETTINGS,
                  event: 'Collectible Detection',
                  properties: {
                    action: 'Collectible Detection',
                    legacy_event: true,
                  },
                });
                if (!value && !openSeaEnabled) {
                  setOpenSeaEnabled(!value);
                }
                setUseCollectibleDetection(!value);
              }}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderOpenSeaEnabledToggle() {
    if (!process.env.COLLECTIBLES_V1) {
      return null;
    }
    const { t } = this.context;
    const {
      openSeaEnabled,
      setOpenSeaEnabled,
      useCollectibleDetection,
      setUseCollectibleDetection,
    } = this.props;

    return (
      <div
        ref={this.settingsRefs[1]}
        className="settings-page__content-row--parent"
      >
        <div className="settings-page__content-item">
          <span>{t('enableOpenSeaAPI')}</span>
          <div className="settings-page__content-description">
            {t('enableOpenSeaAPIDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={openSeaEnabled}
              onToggle={(value) => {
                this.context.trackEvent({
                  category: EVENT.CATEGORIES.SETTINGS,
                  event: 'Enabled/Disable OpenSea',
                  properties: {
                    action: 'Enabled/Disable OpenSea',
                    legacy_event: true,
                  },
                });
                // value is positive when being toggled off
                if (value && useCollectibleDetection) {
                  setUseCollectibleDetection(false);
                }
                setOpenSeaEnabled(!value);
              }}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderEIP1559V2EnabledToggle() {
    const { t } = this.context;
    const { eip1559V2Enabled, setEIP1559V2Enabled } = this.props;

    return (
      <div ref={this.settingsRefs[3]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('enableEIP1559V2')}</span>
          <div className="settings-page__content-description">
            {t('enableEIP1559V2Description', [
              <a
                key="eip_page_link"
                href="https://metamask.io/1559.html"
                rel="noopener noreferrer"
                target="_blank"
              >
                {t('learnMoreUpperCase')}
              </a>,
            ])}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={eip1559V2Enabled}
              onToggle={(value) => {
                this.context.trackEvent({
                  category: EVENT.CATEGORIES.SETTINGS,
                  event: 'Enable/Disable Advanced Gas UI',
                  properties: {
                    action: 'Enable/Disable Advanced Gas UI',
                    legacy_event: true,
                  },
                });
                setEIP1559V2Enabled(!value);
              }}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderCustomNetworkListToggle() {
    const { t } = this.context;
    const { customNetworkListEnabled, setCustomNetworkListEnabled } =
      this.props;

    return (
      <div ref={this.settingsRefs[5]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('showCustomNetworkList')}</span>
          <div className="settings-page__content-description">
            {t('showCustomNetworkListDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={customNetworkListEnabled}
              onToggle={(value) => {
                this.context.trackEvent({
                  category: EVENT.CATEGORIES.SETTINGS,
                  event: 'Enabled/Disable CustomNetworkList',
                  properties: {
                    action: 'Enabled/Disable CustomNetworkList',
                    legacy_event: true,
                  },
                });
                setCustomNetworkListEnabled(!value);
              }}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  ///: BEGIN:ONLY_INCLUDE_IN(desktopextension)
  renderDesktopEnableButton() {
    return (
      <div
        ref={this.settingsRefs[6]}
        className="settings-page__content-row"
        data-testid="advanced-setting-desktop-pairing"
      >
        <div className="settings-page__content-item">
          <span>Click to run all background processes in the desktop app.</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <DesktopEnableButton />
          </div>
        </div>
      </div>
    );
  }
  ///: END:ONLY_INCLUDE_IN

  render() {
    return (
      <div className="settings-page__body">
        {this.renderOpenSeaEnabledToggle()}
        {this.renderCollectibleDetectionToggle()}
        {this.renderEIP1559V2EnabledToggle()}
        {this.renderCustomNetworkListToggle()}
        {
          ///: BEGIN:ONLY_INCLUDE_IN(desktopextension)
          this.renderDesktopEnableButton()
          ///: END:ONLY_INCLUDE_IN
        }
      </div>
    );
  }
}
