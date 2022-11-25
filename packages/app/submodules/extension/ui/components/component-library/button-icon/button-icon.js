import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  ALIGN_ITEMS,
  BORDER_RADIUS,
  COLORS,
  DISPLAY,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';
import { Icon } from '../icon';

import { BUTTON_ICON_SIZES } from './button-icon.constants';

export const ButtonIcon = ({
  ariaLabel,
  as = 'button',
  className,
  color = COLORS.ICON_DEFAULT,
  href,
  size = BUTTON_ICON_SIZES.LG,
  icon,
  disabled,
  iconProps,
  ...props
}) => {
  const Tag = href ? 'a' : as;
  return (
    <Box
      aria-label={ariaLabel}
      as={Tag}
      className={classnames(
        'mm-button-icon',
        `mm-button-icon--size-${size}`,
        {
          'mm-button-icon--disabled': disabled,
        },
        className,
      )}
      color={color}
      disabled={disabled}
      display={DISPLAY.INLINE_FLEX}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      alignItems={ALIGN_ITEMS.CENTER}
      borderRadius={BORDER_RADIUS.LG}
      backgroundColor={COLORS.TRANSPARENT}
      href={href}
      {...props}
    >
      <Icon name={icon} size={size} {...iconProps} />
    </Box>
  );
};

ButtonIcon.propTypes = {
  /**
   *  String that adds an accessible name for ButtonIcon
   */
  ariaLabel: PropTypes.string.isRequired,
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component between `button` and `a` tag
   */
  as: PropTypes.string,
  /**
   * An additional className to apply to the ButtonIcon.
   */
  className: PropTypes.string,
  /**
   * The color of the ButtonIcon component should use the COLOR object from
   * ./ui/helpers/constants/design-system.js
   */
  color: PropTypes.oneOf(Object.values(COLORS)),
  /**
   * Boolean to disable button
   */
  disabled: PropTypes.bool,
  /**
   * When an `href` prop is passed, ButtonIcon will automatically change the root element to be an `a` (anchor) tag
   */
  href: PropTypes.string,
  /**
   * The name of the icon to display. Should be one of ICON_NAMES
   */
  icon: PropTypes.string.isRequired, // Can't set PropTypes.oneOf(ICON_NAMES) because ICON_NAMES is an environment variable
  /**
   * iconProps accepts all the props from Icon
   */
  iconProps: PropTypes.object,
  /**
   * The size of the ButtonIcon.
   * Possible values could be 'SIZES.SM', 'SIZES.LG',
   */
  size: PropTypes.oneOf(Object.values(BUTTON_ICON_SIZES)),
  /**
   * ButtonIcon accepts all the props from Box
   */
  ...Box.propTypes,
};
