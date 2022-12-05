import React from 'react';
import { PropTypes } from 'prop-types';

import PairStatus from '../../../components/pair-status';
import Typography from '../../../../submodules/extension/ui/components/ui/typography';
import Button from '../../../../submodules/extension/ui/components/ui/button';
import Dropdown from '../../../../submodules/extension/ui/components/ui/dropdown';
import { TYPOGRAPHY } from '../../../../submodules/extension/ui/helpers/constants/design-system';
import localeIndex from '../../../helpers/constants/localeIndex';
import themeIndex from '../../../helpers/constants/themeIndex';
import useI18nContext from '../../../hooks/useI18nContext';

// eslint-disable-next-line node/no-extraneous-require
const { ipcRenderer } = window.require('electron');

const GeneralTab = ({
  isWebSocketConnected,
  lastActivation,
  language,
  updateCurrentLanguage,
  theme,
  updateTheme,
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

  const renderUnpairButton = () => {
    return (
      <div className="mmd-settings-page__setting-row">
        <div className="mmd-settings-page__setting-item">
          <div className="mmd-settings-page__setting-col">
            <Button
              type="danger"
              onClick={() => {
                ipcRenderer.invoke('unpair');
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
                ipcRenderer.invoke('reset');
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
      />
      {renderLanguageSettings()}
      {renderThemeSettings()}
      {isWebSocketConnected ? renderUnpairButton() : renderResetButton()}
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
};

export default GeneralTab;
