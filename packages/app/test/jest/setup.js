// This file is for Jest-specific setup only and runs before our Jest tests.

import nock from 'nock';
import '@testing-library/jest-dom';
import { cfg as extensionCfg } from '@metamask/desktop/dist/utils/config';
import desktopAppCfg from '../../app/scripts/desktop/utils/config';

/* eslint-disable-next-line jest/require-top-level-describe */
beforeEach(() => {
  nock.cleanAll();
});

// Disable the test flag in desktop unit tests as this is only used for E2E tests
extensionCfg().isTest = false;
desktopAppCfg().isTest = false;

// Electron supplies window.require but it isn't defined when running unit tests with Jest
window.require = require;
