import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '../button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  DISPLAY,
  JUSTIFY_CONTENT,
  TYPOGRAPHY,
  COLORS,
} from '../../../helpers/constants/design-system';
import Box from '../box/box';
import Typography from '../typography/typography';
import ActionableMessage from '../actionable-message/actionable-message';
import { getCurrentChainId } from '../../../selectors';
import { getCompletedOnboarding } from '../../../ducks/metamask/metamask';

export default function DeprecatedTestNetworks() {
  const currentChainID = useSelector(getCurrentChainId);
  const [isShowingWarning, setIsShowingWarning] = useState(false);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const t = useI18nContext();

  useEffect(() => {
    if (
      completedOnboarding &&
      (currentChainID === '0x3' ||
        currentChainID === '0x2a' ||
        currentChainID === '0x4')
    ) {
      setIsShowingWarning(true);
    } else {
      setIsShowingWarning(false);
    }
  }, [currentChainID, completedOnboarding]);

  return (
    isShowingWarning && (
      <ActionableMessage
        type="warning"
        className="deprecated-test-networks"
        withRightButton
        message={
          <Box
            display={DISPLAY.FLEX}
            className="deprecated-test-networks__content"
          >
            <Box marginRight={2} color={COLORS.WARNING_DEFAULT}>
              <i className="fa fa-info-circle deprecated-test-networks__content__icon" />
            </Box>
            <Box justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}>
              <Typography
                variant={TYPOGRAPHY.H7}
                marginTop={0}
                marginBottom={0}
              >
                {t('deprecatedTestNetworksMsg')}

                <Button
                  className="deprecated-test-networks__content__inline-link"
                  type="link"
                  target="_blank"
                  href="https://blog.ethereum.org/2022/06/21/testnet-deprecation/"
                >
                  {' '}
                  {t('deprecatedTestNetworksLink')}
                </Button>
              </Typography>

              <Box
                className="deprecated-test-networks__content__close"
                marginLeft={2}
                marginTop={0}
                color={COLORS.ICON_ALTERNATIVE}
                onClick={() => setIsShowingWarning(false)}
              />
            </Box>
          </Box>
        }
      />
    )
  );
}
