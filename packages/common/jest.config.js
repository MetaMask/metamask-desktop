module.exports = {
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  reporters: ['default'],
  setupFiles: ['<rootDir>/test/setup.ts'],
  testEnvironment: 'jsdom',
};
