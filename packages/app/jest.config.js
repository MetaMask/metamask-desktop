module.exports = {
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test/results/',
        outputName: 'junit.xml',
      },
    ],
  ],
  roots: ['<rootDir>/src'],
  restoreMocks: true,
  setupFiles: ['<rootDir>/test/setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.{js,ts}'],
  testTimeout: 2500,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  transform: {
    '\\.[jt]s$': ['babel-jest', { configFile: './babel-test.config.js' }],
  },
  transformIgnorePatterns: ['node_modules', '__mocks__'],
  workerIdleMemoryLimit: '500MB',
};
