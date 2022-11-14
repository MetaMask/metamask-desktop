import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { SIZES } from '../../../helpers/constants/design-system';

import Box from '../../ui/box';

import { ICON_NAMES } from '../icon';
import { ButtonIcon } from '../button-icon';

import { TextFieldBase } from '../text-field-base';

export const TextField = ({
  className,
  showClearButton, // only works with a controlled input
  clearButtonOnClick,
  clearButtonProps,
  rightAccessory,
  inputProps,
  value,
  onChange,
  ...props
}) => (
  <TextFieldBase
    className={classnames('mm-text-field', className)}
    value={value}
    onChange={onChange}
    rightAccessory={
      value && showClearButton ? (
        <>
          <ButtonIcon
            className="mm-text-field__button-clear"
            ariaLabel="Clear" // TODO: i18n
            icon={ICON_NAMES.CLOSE_OUTLINE}
            size={SIZES.SM}
            onClick={clearButtonOnClick}
            {...clearButtonProps}
          />
          {rightAccessory}
        </>
      ) : (
        rightAccessory
      )
    }
    inputProps={{
      marginRight: showClearButton ? 6 : 0,
      ...inputProps,
    }}
    {...props}
  />
);

TextField.propTypes = {
  /**
   * The value af the TextField
   */
  value: TextFieldBase.propTypes.value.isRequired,
  /**
   * The onChange handler af the TextField
   */
  onChange: TextFieldBase.propTypes.onChange.isRequired,
  /**
   * An additional className to apply to the text-field
   */
  className: PropTypes.string,
  /**
   * Show a clear button to clear the input
   */
  showClearButton: PropTypes.bool,
  /**
   * The onClick handler for the clear button
   */
  clearButtonOnClick: PropTypes.func,
  /**
   * The props to pass to the clear button
   */
  clearButtonProps: PropTypes.shape(Box.PropTypes),
  /**
   * TextField accepts all the props from TextFieldBase and Box
   */
  ...TextFieldBase.propTypes,
};
