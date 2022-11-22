// This file is for Jest-specific setup only and runs before our Jest tests.

import nock from 'nock';
import '@testing-library/jest-dom';

/* eslint-disable-next-line jest/require-top-level-describe */
beforeEach(() => {
  nock.cleanAll();
});

// Electron supplies window.require but it isn't defined when running unit tests with Jest
window.require = require;
