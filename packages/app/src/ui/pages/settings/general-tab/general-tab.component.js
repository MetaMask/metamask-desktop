import React from 'react';
import { PropTypes } from 'prop-types';

import PairStatus from '../../../components/pair-status';
import Typography from '../../../../../submodules/extension/ui/components/ui/typography';
import Button from '../../../../../submodules/extension/ui/components/ui/button';
import ToggleButton from '../../../../../submodules/extension/ui/components/ui/toggle-button';
import Dropdown from '../../../components/dropdown';
import { TypographyVariant } from '../../../../../submodules/extension/ui/helpers/constants/design-system';
import { LocaleIndex } from '../../../../shared/constants/locale';
import { ThemeIndex } from '../../../../shared/constants/theme';
import { StartupOptionIndex } from '../../../../shared/constants/startup-option';
import useI18nContext from '../../../hooks/useI18nContext';

const GeneralTab = ({
  isWebSocketConnected,
  isDesktopPaired,
  isSuccessfulPairSeen,
  lastActivation,
  language,
  updateCurrentLanguage,
  theme,
  updateTheme,
  preferredStartup,
  updatePreferredStartup,
  isDesktopPopupEnabled,
  updateDesktopPopupEnabled,
}) => {
  const t = useI18nContext();
  const isDesktopPopupOptionAvailable = window.config.enableDesktopPopup;

  const renderDesktopPopupToggle = () => {
    return (
      <div className="mmd-settings-page__setting-row">
        <div className="mmd-settings-page__setting-item">
          <Typography variant={TypographyVariant.H5}>
            {t('desktopPopup')}
          </Typography>
          <Typography variant={TypographyVariant.H6}>
            {t('desktopPopupDescription')}
          </Typography>
        </div>
        <div className="mmd-settings-page__setting-item">
          <div className="mmd-settings-page__setting-col">
            <ToggleButton
              value={isDesktopPopupEnabled}
              onToggle={(toggleValue) => {
                if (toggleValue) {
                  updateDesktopPopupEnabled(!toggleValue);
                } else {
                  window.electronBridge
                    .openDialog({
                      type: 'info',
                      message: t('enableDesktopPopup'),
                      buttons: [t('yes'), t('no')],
                    })
                    .then(async (value) => {
                      if (value.response === 0) {
                        updateDesktopPopupEnabled(!toggleValue);
                      }
                    });
                }
              }}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderLanguageSettings = () => {
    const localeOptions = LocaleIndex.map((locale) => {
      return {
        name: `${locale.name}`,
        value: locale.code,
      };
    });

    return (
      <div className="mmd-settings-page__setting-row">
        <div className="mmd-settings-page__setting-item">
          <Typography variant={TypographyVariant.H5}>
            {t('language')}
          </Typography>
          <Typography variant={TypographyVariant.H6}>
            {t('chooseYourPreferredLanguage')}
          </Typography>
        </div>
        <div className="mmd-settings-page__setting-item">
          <div className="mmd-settings-page__setting-col">
            <Dropdown
              options={localeOptions}
              selectedOption={language}
              onChange={(newLocale) => updateCurrentLanguage(newLocale)}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderThemeSettings = () => {
    const themeOptions = ThemeIndex.map((themeOption) => {
      return {
        name: t(themeOption.name),
        value: themeOption.value,
      };
    });
    const currentTheme = themeOptions.find((option) => option.value === theme);

    return (
      <div className="mmd-settings-page__setting-row">
        <div className="mmd-settings-page__setting-item">
          <Typography variant={TypographyVariant.H5}>{t('theme')}</Typography>
          <Typography variant={TypographyVariant.H6}>
            {t('chooseYourPreferredMetaMaskTheme')}
          </Typography>
        </div>
        <div className="mmd-settings-page__setting-item">
          <div className="mmd-settings-page__setting-col">
            <Dropdown
              options={themeOptions}
              selectedOption={currentTheme.value}
              onChange={(newTheme) => updateTheme(newTheme)}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderPreferredStartupOptions = () => {
    const preferredStartupOptions = StartupOptionIndex.map((startupOption) => {
      return {
        name: t(startupOption.name),
        value: startupOption.value,
      };
    });

    return (
      <div className="mmd-settings-page__setting-row">
        <div className="mmd-settings-page__setting-item">
          <Typography variant={TypographyVariant.H5}>
            {t('openAtLogin')}
          </Typography>
          <Typography variant={TypographyVariant.H6}>
            {t('allowOpenAtLoginDescription')}
          </Typography>
        </div>
        <div className="mmd-settings-page__setting-item">
          <div className="mmd-settings-page__setting-col">
            <Dropdown
              options={preferredStartupOptions}
              selectedOption={preferredStartup}
              onChange={(value) => updatePreferredStartup(value)}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderUnpairButton = () => {
    return (
      <div className="mmd-settings-page__setting-row">
        <div className="mmd-settings-page__setting-item">
          <div className="mmd-settings-page__setting-col">
            <Button
              type="danger"
              onClick={() => {
                window.electronBridge.unpair();
              }}
            >
              {t('removeConnection')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderResetButton = () => {
    return (
      <div className="mmd-settings-page__setting-row">
        <div className="mmd-settings-page__setting-item">
          <div className="mmd-settings-page__setting-col">
            <Button
              type="danger"
              onClick={() => {
                window.electronBridge.reset();
              }}
            >
              {t('resetConnection')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderFactoryResetButton = () => {
    return (
      <div className="mmd-settings-page__setting-row">
        <div className="mmd-settings-page__setting-item">
          <div className="mmd-settings-page__setting-col">
            <Button
              type="danger"
              onClick={() => {
                window.electronBridge.factoryReset();
              }}
            >
              {t('factoryReset')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PairStatus
        isWebSocketConnected={isWebSocketConnected}
        lastActivation={lastActivation}
        isDesktopPaired={isDesktopPaired}
        isSuccessfulPairSeen={isSuccessfulPairSeen}
      />
      {isDesktopPopupOptionAvailable && renderDesktopPopupToggle()}
      {renderLanguageSettings()}
      {renderThemeSettings()}
      {renderPreferredStartupOptions()}
      {isSuccessfulPairSeen &&
        (isWebSocketConnected ? renderUnpairButton() : renderResetButton())}
      {renderFactoryResetButton()}
    </>
  );
};

GeneralTab.propTypes = {
  /**
   * Whether the web socket is connected with the extension
   */
  isWebSocketConnected: PropTypes.bool,
  /**
   * The last time the app was activated
   */
  lastActivation: PropTypes.number,
  /**
   * The current language
   */
  language: PropTypes.string,
  /**
   * Updates the current language
   */
  updateCurrentLanguage: PropTypes.func,
  /**
   * The current theme
   */
  theme: PropTypes.string,
  /**
   * Updates the current theme
   */
  updateTheme: PropTypes.func,
  /**
   * Whether the app is paired with the extension
   */
  isDesktopPaired: PropTypes.bool,
  /**
   * Whether the user has successfully paired with the desktop app
   */
  isSuccessfulPairSeen: PropTypes.bool,
  /**
   * The user's preferred startup option
   */
  preferredStartup: PropTypes.string,
  /**
   * Updates the user's preferred startup option
   */
  updatePreferredStartup: PropTypes.func,
  /**
   * Updates the desktop popup enabled state
   */
  updateDesktopPopupEnabled: PropTypes.func,
  /**
   * Whether the desktop popup option is available
   */
  isDesktopPopupEnabled: PropTypes.bool,
};

export default GeneralTab;
