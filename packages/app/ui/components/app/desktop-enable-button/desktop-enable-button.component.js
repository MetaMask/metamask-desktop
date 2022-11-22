import React from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { browser } from '@metamask/desktop/dist/browser';
import Button from '../../ui/button';
import {
  DESKTOP_ERROR_ROUTE,
  DESKTOP_PAIRING_ROUTE,
} from '../../../helpers/constants/routes';
import { EXTENSION_ERROR_PAGE_TYPES } from '../../../../shared/constants/desktop';
import { getIsDesktopEnabled } from '../../../selectors';
import {
  hideLoadingIndication,
  showLoadingIndication,
  setDesktopEnabled as setDesktopEnabledAction,
  testDesktopConnection,
  disableDesktop,
} from '../../../store/actions';
import { SECOND } from '../../../../shared/constants/time';

const DESKTOP_ERROR_DESKTOP_OUTDATED_ROUTE = `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.DESKTOP_OUTDATED}`;
const DESKTOP_ERROR_EXTENSION_OUTDATED_ROUTE = `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.EXTENSION_OUTDATED}`;
const DESKTOP_ERROR_NOT_FOUND_ROUTE = `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.NOT_FOUND}`;
const SKIP_PAIRING_RESTART_DELAY = 2 * SECOND;

export default function DesktopEnableButton() {
  const dispatch = useDispatch();
  const history = useHistory();
  const showLoader = () => dispatch(showLoadingIndication());
  const hideLoader = () => dispatch(hideLoadingIndication());
  const desktopEnabled = useSelector(getIsDesktopEnabled);
  const setDesktopEnabled = (val) => dispatch(setDesktopEnabledAction(val));
  const restart = () => dispatch(browser.runtime.reload());

  const onClick = async () => {
    if (desktopEnabled) {
      await disableDesktop();
      setDesktopEnabled(false);
      return;
    }

    showLoader();
    const testResult = await testDesktopConnection();
    hideLoader();

    if (!testResult.isConnected) {
      history.push(DESKTOP_ERROR_NOT_FOUND_ROUTE);
      return;
    }

    if (!testResult.versionCheck.isExtensionVersionValid) {
      history.push(DESKTOP_ERROR_EXTENSION_OUTDATED_ROUTE);
      return;
    }

    if (!testResult.versionCheck.isDesktopVersionValid) {
      history.push(DESKTOP_ERROR_DESKTOP_OUTDATED_ROUTE);
      return;
    }

    if (process.env.SKIP_OTP_PAIRING_FLOW) {
      showLoader();
      setDesktopEnabled(true);

      // Wait for new state to persist before restarting
      setTimeout(() => {
        restart();
      }, SKIP_PAIRING_RESTART_DELAY);
      return;
    }

    history.push(DESKTOP_PAIRING_ROUTE);
  };

  return (
    <Button
      type="primary"
      large
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {desktopEnabled ? 'Disable Desktop App' : 'Enable Desktop App'}
    </Button>
  );
}
