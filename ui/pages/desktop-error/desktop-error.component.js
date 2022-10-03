import React from 'react';
import { useParams, useHistory } from 'react-router-dom';

import { useI18nContext } from '../../hooks/useI18nContext';
import IconTimes from '../../components/ui/icon/icon-times';
import { EXTENSION_ERROR_PAGE_IDS } from '../../../shared/constants/desktop';
import {
  TYPOGRAPHY,
  DISPLAY,
  FLEX_DIRECTION,
  ALIGN_ITEMS,
  TEXT_ALIGN,
} from '../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import Typography from '../../components/ui/typography';
import Button from '../../components/ui/button';
import Box from '../../components/ui/box';

export default function DesktopError() {
  const t = useI18nContext();
  const { errorId } = useParams();
  const history = useHistory();

  const downloadMetamaskDesktop = () => {
    // TBD
  };

  const reconnectMetamaskDesktop = () => {
    // TBD
  };

  const updateMetamaskDesktop = () => {
    // TBD
  };

  const returnExtensionHome = () => {
    history.push(DEFAULT_ROUTE);
  };

  const renderError = ({ id }) => {
    let content;
    switch (id) {
      case EXTENSION_ERROR_PAGE_IDS.NOT_FOUND:
        content = (
          <>
            <Typography
              variant={TYPOGRAPHY.H4}
              fontWeight={700}
              marginTop={6}
              marginBottom={6}
            >
              {t('desktopNotFoundErrorTitle')}
            </Typography>
            <Typography variant={TYPOGRAPHY.Paragraph}>
              {t('desktopNotFoundErrorDescription1')}
            </Typography>
            <Typography variant={TYPOGRAPHY.Paragraph}>
              {t('desktopNotFoundErrorDescription2')}
            </Typography>
            <Box marginTop={6}>
              <Button
                type="primary"
                onClick={downloadMetamaskDesktop}
                marginTop={6}
              >
                {t('desktopNotFoundErrorCTA')}
              </Button>
            </Box>
          </>
        );
        break;

      case EXTENSION_ERROR_PAGE_IDS.CONNECTION_LOST:
        content = (
          <>
            <Typography
              variant={TYPOGRAPHY.H4}
              fontWeight={700}
              marginTop={6}
              marginBottom={6}
            >
              {t('desktopConnectionLostErrorTitle')}
            </Typography>
            <Typography variant={TYPOGRAPHY.Paragraph}>
              {t('desktopConnectionLostErrorDescription')}
            </Typography>
            <Box marginTop={6}>
              <Button
                type="primary"
                onClick={reconnectMetamaskDesktop}
                marginTop={6}
              >
                {t('desktopConnectionLostErrorCTA')}
              </Button>
            </Box>
          </>
        );
        break;

      case EXTENSION_ERROR_PAGE_IDS.DESKTOP_OUTDATED:
        content = (
          <>
            <Typography
              variant={TYPOGRAPHY.H4}
              fontWeight={700}
              marginTop={6}
              marginBottom={6}
            >
              {t('desktopOutdatedErrorTitle')}
            </Typography>
            <Typography variant={TYPOGRAPHY.Paragraph}>
              {t('desktopOutdatedErrorDescription')}
            </Typography>
            <Box marginTop={6}>
              <Button
                type="primary"
                onClick={updateMetamaskDesktop}
                marginTop={6}
              >
                {t('desktopOutdatedErrorCTA')}
              </Button>
            </Box>
          </>
        );
        break;

      default:
        content = (
          <>
            <Typography
              variant={TYPOGRAPHY.H4}
              fontWeight={700}
              marginTop={6}
              marginBottom={6}
            >
              {t('desktopUnexpectedErrorTitle')}
            </Typography>
            <Typography variant={TYPOGRAPHY.Paragraph}>
              {t('desktopUnexpectedErrorDescription')}
            </Typography>
            <Box marginTop={6}>
              <Button
                type="primary"
                onClick={returnExtensionHome}
                marginTop={6}
              >
                {t('desktopUnexpectedErrorCTA')}
              </Button>
            </Box>
          </>
        );
        break;
    }
    return (
      <Box
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        textAlign={TEXT_ALIGN.CENTER}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <IconTimes size={64} color="var(--color-error-default" />
        {content}
      </Box>
    );
  };

  return (
    <section className="error-page">{renderError({ id: errorId })}</section>
  );
}
