import React from 'react';
import { PropTypes } from 'prop-types';

import PairStatus from '../../../components/pair-status';
import Typography from '../../../../components/ui/typography';
import Dropdown from '../../../../components/ui/dropdown';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import localeIndex from '../../../helpers/constants/localeIndex';
import themeIndex from '../../../helpers/constants/themeIndex';
import useI18nContext from '../../../hooks/useI18nContext';

const GeneralTab = ({
  isPaired,
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
    const currentLanguage = localeOptions.find(
      (option) => option.value === language,
    );

    return (
      <div className="mmd-settings-page__setting-row">
        <div className="mmd-settings-page__setting-item">
          <Typography variant={TYPOGRAPHY.H5}>
            {t('currentLanguage')}
          </Typography>
          <Typography variant={TYPOGRAPHY.H6}>
            {currentLanguage.name}
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

  return (
    <>
      <PairStatus isPaired={isPaired} lastActivation={lastActivation} />
      {renderLanguageSettings()}
      {renderThemeSettings()}
    </>
  );
};

GeneralTab.propTypes = {
  /**
   * Whether the app is paired with the extension
   */
  isPaired: PropTypes.bool,
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