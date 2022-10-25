import React, { createContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getMessage } from '../helpers/utils/i18n-helper';
import { getCurrentLocales, getEnLocales } from '../ducks/locale/locale';
import { getLanguage } from '../ducks/app/app';

export const I18nContext = createContext((key) => `[${key}]`);

export const I18nProvider = (props) => {
  const currentLocale = useSelector(getLanguage);
  const current = useSelector(getCurrentLocales);
  const en = useSelector(getEnLocales);

  const t = useMemo(() => {
    return (key, ...args) =>
      getMessage(currentLocale, current, key, ...args) ||
      getMessage(currentLocale, en, key, ...args);
  }, [currentLocale, current, en]);

  return (
    <I18nContext.Provider value={t}>{props.children}</I18nContext.Provider>
  );
};

I18nProvider.propTypes = {
  children: PropTypes.node,
};

I18nProvider.defaultProps = {
  children: undefined,
};
