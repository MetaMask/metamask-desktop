import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../../components/ui/button';
import Popover from '../../../components/ui/popover';
import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import {
  ALIGN_ITEMS,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Checkbox from '../../../components/ui/check-box';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';

export default function SkipSRPBackup({ handleClose }) {
  const [checked, setChecked] = useState(false);
  const t = useI18nContext();
  const history = useHistory();
  return (
    <Popover
      className="skip-srp-backup-popover"
      footer={
        <Box
          className="skip-srp-backup-popover__footer"
          justifyContent={JUSTIFY_CONTENT.CENTER}
          alignItems={ALIGN_ITEMS.CENTER}
        >
          <Button onClick={handleClose} type="secondary" rounded>
            {t('goBack')}
          </Button>
          <Button
            data-testid="skip-srp-backup"
            disabled={!checked}
            type="primary"
            rounded
            onClick={() => history.push(ONBOARDING_COMPLETION_ROUTE)}
          >
            {t('skip')}
          </Button>
        </Box>
      }
    >
      <Box
        flexDirection={FLEX_DIRECTION.COLUMN}
        alignItems={ALIGN_ITEMS.CENTER}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        margin={4}
      >
        <i className="fa fa-exclamation-triangle fa-2x skip-srp-backup-popover__icon" />
        <Typography variant={TYPOGRAPHY.h3} fontWeight={FONT_WEIGHT.BOLD}>
          {t('skipAccountSecurity')}
        </Typography>
        <Box justifyContent={JUSTIFY_CONTENT.CENTER} margin={3}>
          <label className="skip-srp-backup-popover__label">
            <Checkbox
              className="skip-srp-backup-popover__checkbox"
              onClick={() => setChecked(!checked)}
              checked={checked}
              dataTestId="skip-srp-backup-popover-checkbox"
            />
            <Typography
              className="skip-srp-backup-popover__details"
              variant={TYPOGRAPHY.h7}
            >
              {t('skipAccountSecurityDetails')}
            </Typography>
          </label>
        </Box>
      </Box>
    </Popover>
  );
}

SkipSRPBackup.propTypes = {
  handleClose: PropTypes.func,
};
