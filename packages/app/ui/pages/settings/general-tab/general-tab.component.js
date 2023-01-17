import React from 'react';
import { PropTypes } from 'prop-types';

import PairStatus from '../../../components/pair-status';
import Typography from '../../../../submodules/extension/ui/components/ui/typography';
import Button from '../../../../submodules/extension/ui/components/ui/button';
import ToggleButton from '../../../../submodules/extension/ui/components/ui/toggle-button';
import Dropdown from '../../../components/dropdown';
import { TYPOGRAPHY } from '../../../../submodules/extension/ui/helpers/constants/design-system';
import localeIndex from '../../../helpers/constants/localeIndex';
import themeIndex from '../../../helpers/constants/themeIndex';
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
  openAtLogin,
  updateOpenAtLogin,
}) => {
  const t = useI18nContext();

  const renderLanguageSettings = () => {
    const localeOptions = localeIndex.map((locale) => {
      return {
        name: `${locale.name}`,
        value: locale.code,
      };
    });

    return (
      <div className="mmd-settings-page__setting-row">
        <div className="mmd-settings-page__setting-item">
          <Typography variant={TYPOGRAPHY.H5}>{t('language')}</Typography>
          <Typography variant={TYPOGRAPHY.H6}>
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
    const themeOptions = themeIndex.map((themeOption) => {
      return {
        name: t(themeOption.name),
        value: themeOption.value,
      };
    });
    const currentTheme = themeOptions.find((option) => option.value === theme);

    return (
      <div className="mmd-settings-page__setting-row">
        <div className="mmd-settings-page__setting-item">
          <Typography variant={TYPOGRAPHY.H5}>{t('theme')}</Typography>
          <Typography variant={TYPOGRAPHY.H6}>
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

  const renderOpenAtLogin = () => {
    return (
      <div className="mmd-settings-page__setting-row">
        <div className="mmd-settings-page__setting-item">
          <Typography variant={TYPOGRAPHY.H5}>{t('openAtLogin')}</Typography>
          <Typography variant={TYPOGRAPHY.H6}>
            {t('allowOpenAtLoginDescription')}
          </Typography>
        </div>
        <div className="mmd-settings-page__setting-item">
          <div className="mmd-settings-page__setting-col">
            <ToggleButton
              value={openAtLogin}
              onToggle={(value) => updateOpenAtLogin(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
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

  return (
    <>
      <PairStatus
        isWebSocketConnected={isWebSocketConnected}
        lastActivation={lastActivation}
        isDesktopPaired={isDesktopPaired}
        isSuccessfulPairSeen={isSuccessfulPairSeen}
      />
      {renderLanguageSettings()}
      {renderThemeSettings()}
      {renderOpenAtLogin()}
      {isSuccessfulPairSeen &&
        (isWebSocketConnected ? renderUnpairButton() : renderResetButton())}
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
};

export default GeneralTab;
