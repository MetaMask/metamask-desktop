import React from 'react';
import PropTypes from 'prop-types';

const IconDesktopPairing = ({
  size = 24,
  color = 'currentColor',
  ariaLabel,
  className,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    fill={color}
    className={className}
    aria-label={ariaLabel}
    onClick={onClick}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
  >
    <path d="m410 340c0-1 0-1 0-2l0-195c0-31-25-56-56-56l-81 0 29-24c7-5 8-15 2-22-5-6-15-7-21-2l-62 52c-3 2-5 7-5 11 0 5 2 9 5 12l62 51c3 3 6 4 9 4 5 0 9-2 12-6 6-6 5-16-2-21l-29-24 81 0c14 0 26 11 26 25l0 195c0 1 0 1 0 2-27 7-47 31-47 59 0 34 28 62 62 62 34 0 61-28 61-62 0-28-20-52-46-59z m-128 58l-62-51c-6-6-16-5-21 2-6 6-5 16 2 21l29 24-81 0c-14 0-25-11-25-25l0-195c0-1-1-1-1-2 27-7 47-31 47-59 0-34-28-62-62-62-34 0-61 28-61 62 0 28 20 52 46 59 0 1 0 1 0 2l0 195c0 31 25 56 56 56l81 0-29 24c-7 5-8 15-2 22 3 3 7 5 12 5 3 0 7-1 9-3l62-52c3-2 5-7 5-11 0-5-2-9-5-12z" />
  </svg>
);

IconDesktopPairing.propTypes = {
  /**
   * The size of the Icon follows an 8px grid 2 = 16px, 3 = 24px etc
   */
  size: PropTypes.number,
  /**
   * The color of the icon accepts design token css variables
   */
  color: PropTypes.string,
  /**
   * An additional className to assign the Icon
   */
  className: PropTypes.string,
  /**
   * The onClick handler
   */
  onClick: PropTypes.func,
  /**
   * The aria-label of the icon for accessibility purposes
   */
  ariaLabel: PropTypes.string,
};

export default IconDesktopPairing;
