import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import availableCurrencies from '../../../helpers/constants/available-conversions.json';
import { TYPOGRAPHY, COLORS } from '../../../helpers/constants/design-system';
import Dropdown from '../../../components/ui/dropdown';
import ToggleButton from '../../../components/ui/toggle-button';
import locales from '../../../../app/_locales/index.json';
import Jazzicon from '../../../components/ui/jazzicon';
import BlockieIdenticon from '../../../components/ui/identicon/blockieIdenticon';
import Typography from '../../../components/ui/typography';
import { EVENT } from '../../../../shared/constants/metametrics';

import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import { THEME_TYPE } from './settings-tab.constant';

const sortedCurrencies = availableCurrencies.sort((a, b) => {
  return a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase());
});

const currencyOptions = sortedCurrencies.map(({ code, name }) => {
  return {
    name: `${code.toUpperCase()} - ${name}`,
    value: code,
  };
});

const localeOptions = locales.map((locale) => {
  return {
    name: `${locale.name}`,
    value: locale.code,
  };
});

export default class SettingsTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    setUseBlockie: PropTypes.func,
    setCurrentCurrency: PropTypes.func,
    warning: PropTypes.string,
    updateCurrentLocale: PropTypes.func,
    currentLocale: PropTypes.string,
    useBlockie: PropTypes.bool,
    currentCurrency: PropTypes.string,
    nativeCurrency: PropTypes.string,
    useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
    setUseNativeCurrencyAsPrimaryCurrencyPreference: PropTypes.func,
    hideZeroBalanceTokens: PropTypes.bool,
    setHideZeroBalanceTokens: PropTypes.func,
    lastFetchedConversionDate: PropTypes.number,
    selectedAddress: PropTypes.string,
    tokenList: PropTypes.object,
    theme: PropTypes.string,
    setTheme: PropTypes.func,
  };

  settingsRefs = Array(
    getNumberOfSettingsInSection(this.context.t, this.context.t('general')),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef();
    });

  componentDidUpdate() {
    const { t } = this.context;
    handleSettingsRefs(t, t('general'), this.settingsRefs);
  }

  componentDidMount() {
    const { t } = this.context;
    handleSettingsRefs(t, t('general'), this.settingsRefs);
  }

  renderCurrentConversion() {
    const { t } = this.context;
    const { currentCurrency, setCurrentCurrency, lastFetchedConversionDate } =
      this.props;

    return (
      <div ref={this.settingsRefs[0]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('currencyConversion')}</span>
          <span className="settings-page__content-description">
            {lastFetchedConversionDate
              ? t('updatedWithDate', [
                  new Date(lastFetchedConversionDate * 1000).toString(),
                ])
              : t('noConversionDateAvailable')}
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Dropdown
              id="select-currency"
              options={currencyOptions}
              selectedOption={currentCurrency}
              onChange={(newCurrency) => setCurrentCurrency(newCurrency)}
            />
          </div>
        </div>
      </div>
    );
  }

  renderCurrentLocale() {
    const { t } = this.context;
    const { updateCurrentLocale, currentLocale } = this.props;
    const currentLocaleMeta = locales.find(
      (locale) => locale.code === currentLocale,
    );
    const currentLocaleName = currentLocaleMeta ? currentLocaleMeta.name : '';

    return (
      <div ref={this.settingsRefs[2]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span className="settings-page__content-label">
            {t('currentLanguage')}
          </span>
          <span className="settings-page__content-description">
            {currentLocaleName}
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Dropdown
              id="select-locale"
              options={localeOptions}
              selectedOption={currentLocale}
              onChange={async (newLocale) => updateCurrentLocale(newLocale)}
            />
          </div>
        </div>
      </div>
    );
  }

  renderHideZeroBalanceTokensOptIn() {
    const { t } = this.context;
    const { hideZeroBalanceTokens, setHideZeroBalanceTokens } = this.props;

    return (
      <div
        ref={this.settingsRefs[5]}
        className="settings-page__content-row"
        id="toggle-zero-balance"
      >
        <div className="settings-page__content-item">
          <span>{t('hideZeroBalanceTokens')}</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={hideZeroBalanceTokens}
              onToggle={(value) => setHideZeroBalanceTokens(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderBlockieOptIn() {
    const { t } = this.context;
    const { useBlockie, setUseBlockie, selectedAddress, tokenList } =
      this.props;

    const getIconStyles = () => ({
      display: 'block',
      borderRadius: '16px',
      width: '32px',
      height: '32px',
    });

    return (
      <div
        ref={this.settingsRefs[4]}
        className="settings-page__content-row"
        id="blockie-optin"
      >
        <div className="settings-page__content-item">
          <Typography variant={TYPOGRAPHY.H5} color={COLORS.TEXT_DEFAULT}>
            {t('accountIdenticon')}
          </Typography>
          <span className="settings-page__content-item__description">
            {t('jazzAndBlockies')}
          </span>
          <div className="settings-page__content-item__identicon">
            <button
              data-test-id="jazz_icon"
              onClick={() => setUseBlockie(false)}
              className="settings-page__content-item__identicon__item"
            >
              <div
                className={classnames(
                  'settings-page__content-item__identicon__item__icon',
                  {
                    'settings-page__content-item__identicon__item__icon--active':
                      !useBlockie,
                  },
                )}
              >
                <Jazzicon
                  id="jazzicon"
                  address={selectedAddress}
                  diameter={32}
                  tokenList={tokenList}
                  style={getIconStyles()}
                />
              </div>
              <Typography
                color={COLORS.TEXT_DEFAULT}
                variant={TYPOGRAPHY.H7}
                marginTop={0}
                marginRight={12}
                marginBottom={0}
                marginLeft={3}
              >
                {t('jazzicons')}
              </Typography>
            </button>
            <button
              data-test-id="blockie_icon"
              onClick={() => setUseBlockie(true)}
              className="settings-page__content-item__identicon__item"
            >
              <div
                className={classnames(
                  'settings-page__content-item__identicon__item__icon',
                  {
                    'settings-page__content-item__identicon__item__icon--active':
                      useBlockie,
                  },
                )}
              >
                <BlockieIdenticon
                  id="blockies"
                  address={selectedAddress}
                  diameter={32}
                  borderRadius="50%"
                />
              </div>
              <Typography
                color={COLORS.TEXT_DEFAULT}
                variant={TYPOGRAPHY.H7}
                marginTop={3}
                marginRight={0}
                marginBottom={3}
                marginLeft={3}
              >
                {t('blockies')}
              </Typography>
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderUsePrimaryCurrencyOptions() {
    const { t } = this.context;
    const {
      nativeCurrency,
      setUseNativeCurrencyAsPrimaryCurrencyPreference,
      useNativeCurrencyAsPrimaryCurrency,
    } = this.props;

    return (
      <div ref={this.settingsRefs[1]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('primaryCurrencySetting')}</span>
          <div className="settings-page__content-description">
            {t('primaryCurrencySettingDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <div className="settings-tab__radio-buttons">
              <div className="settings-tab__radio-button">
                <input
                  type="radio"
                  id="native-primary-currency"
                  onChange={() =>
                    setUseNativeCurrencyAsPrimaryCurrencyPreference(true)
                  }
                  checked={Boolean(useNativeCurrencyAsPrimaryCurrency)}
                />
                <label
                  htmlFor="native-primary-currency"
                  className="settings-tab__radio-label"
                >
                  {nativeCurrency}
                </label>
              </div>
              <div className="settings-tab__radio-button">
                <input
                  type="radio"
                  id="fiat-primary-currency"
                  onChange={() =>
                    setUseNativeCurrencyAsPrimaryCurrencyPreference(false)
                  }
                  checked={!useNativeCurrencyAsPrimaryCurrency}
                />
                <label
                  htmlFor="fiat-primary-currency"
                  className="settings-tab__radio-label"
                >
                  {t('fiat')}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderTheme() {
    const { t } = this.context;
    const { theme, setTheme } = this.props;

    const themesOptions = [
      {
        name: t('lightTheme'),
        value: THEME_TYPE.LIGHT,
      },
      {
        name: t('darkTheme'),
        value: THEME_TYPE.DARK,
      },
      {
        name: t('osTheme'),
        value: THEME_TYPE.OS,
      },
    ];

    const onChange = (newTheme) => {
      this.context.trackEvent({
        category: EVENT.CATEGORIES.SETTINGS,
        event: 'Theme Changed',
        properties: {
          theme_selected: newTheme,
        },
      });
      setTheme(newTheme);
    };

    return (
      <div ref={this.settingsRefs[3]} className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{this.context.t('theme')}</span>
          <div className="settings-page__content-description">
            {this.context.t('themeDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Dropdown
              id="select-theme"
              options={themesOptions}
              selectedOption={theme}
              onChange={onChange}
            />
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { warning } = this.props;

    return (
      <div className="settings-page__body">
        {warning ? <div className="settings-tab__error">{warning}</div> : null}
        {this.renderCurrentConversion()}
        {this.renderUsePrimaryCurrencyOptions()}
        {this.renderCurrentLocale()}
        {this.renderTheme()}
        {this.renderBlockieOptIn()}
        {this.renderHideZeroBalanceTokensOptIn()}
      </div>
    );
  }
}
