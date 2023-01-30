import { useContext } from 'react';
import { I18nContext } from '../contexts/i18n';

/**
 *
 */
export default function useI18nContext() {
  return useContext(I18nContext);
}
