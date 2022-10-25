module.exports = {
  // TODO: Remove the `exit` setting, it can hide broken tests.
  exit: true,
  ignore: [
    './app/scripts/desktop/**/*.test.js',
    './app/scripts/lib/**/*.test.js',
    './app/scripts/migrations/*.test.js',
    './app/scripts/platforms/*.test.js',
    './app/scripts/controllers/network/**/*.test.js',
    './app/scripts/controllers/permissions/**/*.test.js',
    './app/scripts/controllers/desktop.test.ts',
    './app/scripts/constants/error-utils.test.js',
  ],
  recursive: true,
  require: ['test/env.js', 'test/setup.js'],
};
