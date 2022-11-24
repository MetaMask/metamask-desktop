import React from 'react';
import PropTypes from 'prop-types';

import { useHistory } from 'react-router-dom';

import Typography from '../../../ui/typography/typography';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SNAPS_VIEW_ROUTE } from '../../../../helpers/constants/routes';
import {
  COLORS,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  ALIGN_ITEMS,
} from '../../../../helpers/constants/design-system';
import Button from '../../../ui/button';
import Box from '../../../ui/box/box';

export default function SnapContentFooter({ snapName, snapId }) {
  const t = useI18nContext();
  const history = useHistory();

  const handleNameClick = (e) => {
    e.stopPropagation();
    history.push(`${SNAPS_VIEW_ROUTE}/${encodeURIComponent(snapId)}`);
  };
  // TODO: add truncation to the snap name, need to pick a character length at which to cut off
  return (
    <Box
      justifyContent={JUSTIFY_CONTENT.CENTER}
      alignItems={ALIGN_ITEMS.CENTER}
      paddingTop={4}
      paddingBottom={4}
      className="snap-content-footer"
    >
      <i className="fas fa-exclamation-circle fa-sm" />
      <Typography color={COLORS.TEXT_MUTED} variant={TYPOGRAPHY.H7}>
        {t('snapContent', [
          <Button type="inline" onClick={handleNameClick} key="button">
            {snapName}
          </Button>,
        ])}
      </Typography>
    </Box>
  );
}

SnapContentFooter.propTypes = {
  /**
   * The name of the snap who's content is displayed
   */
  snapName: PropTypes.string,
  /**
   * The id of the snap
   */
  snapId: PropTypes.string,
};
