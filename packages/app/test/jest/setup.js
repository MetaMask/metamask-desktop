// This file is for Jest-specific setup only and runs before our Jest tests.

import nock from 'nock';
import '@testing-library/jest-dom';
import cfg from '../../app/scripts/desktop/utils/config';

jest.mock('webextension-polyfill', () => {
  return {
    runtime: {
      getManifest: () => ({ manifest_version: 2 }),
    },
  };
});

/* eslint-disable-next-line jest/require-top-level-describe */
beforeEach(() => {
  nock.cleanAll();
});

// Disable the test flag in desktop unit tests as this is only used for E2E tests
cfg().desktop.isTest = false;
