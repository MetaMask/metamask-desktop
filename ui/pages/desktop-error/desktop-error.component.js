import { useParams, useHistory } from 'react-router-dom';
import { useI18nContext } from '../../hooks/useI18nContext';
import { renderDesktopError } from './render-desktop-error';

import {
  downloadDesktopApp,
  downloadExtension,
  restartExtension,
} from '../../../shared/lib/error-utils';

export default function DesktopError({ disableDesktop }) {
  const t = useI18nContext();
  const { errorType } = useParams();
  const history = useHistory();

  return renderDesktopError({
    type: errorType,
    t,
    isHtmlError: false,
    history,
    disableDesktop,
    downloadDesktopApp,
    downloadExtension,
    restartExtension,
  });
}
