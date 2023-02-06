import memoize from 'memoizee';
import log from 'loglevel';

import { readPersistedSettingFromAppState } from '../storage/ui-storage';
import { getPureMessage } from '../../shared/locales/getPureMessage';
import { locales } from '../../shared/locales';
import { LOCALE_KEYS } from '../../shared/constants/locale';

let language = readPersistedSettingFromAppState({
  defaultValue: LOCALE_KEYS.EN,
  key: 'language',
});

export const setLanguage = (newLang: string) => {
  language = newLang;
};

export const t = memoize((key: string) => {
  const current = locales[language];
  const { en } = locales;
  return (
    getPureMessage(language, current, key, log) ||
    getPureMessage(LOCALE_KEYS.EN, en, key, log)
  );
});
