module.exports = {
  root: true,

  extends: ['@metamask/eslint-config'],

  overrides: [
    {
      files: ['src/app/**/*'],
      excludedFiles: ['src/app/**/*.{test,spec}.{js,ts}'],
      extends: ['.eslintrc.app.js'],
    },
    {
      files: [
        'src/{ui,popup-ui}/**/*.{js,ts,jsx,tsx}',
        'src/shared/**/*.{js,ts,jsx,tsx}',
      ],
      excludedFiles: ['src/{ui,popup-ui}/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      extends: ['.eslintrc.ui.js'],
    },
    {
      files: ['**/*.{test,spec}.ts', '**/*.{test,spec}.js', 'test/**/*'],
      extends: ['.eslintrc.test.js'],
    },
    {
      files: ['playwright.config.ts'],
      extends: ['.eslintrc.typescript.js'],
      parserOptions: {
        ecmaVersion: 11,
      },
    },
    {
      files: ['.eslintrc.js', '.eslintrc.*.js', '*.config.js', 'build/**/*.js'],
      extends: ['@metamask/eslint-config-nodejs'],
      parserOptions: {
        ecmaVersion: 11,
      },
      rules: {
        'jsdoc/require-jsdoc': 'off',
        'jsdoc/valid-types': 'off',
        'node/no-unpublished-require': 'off',
        'node/no-sync': 'off',
        'node/no-process-exit': 'off',
        'node/no-process-env': 'off',
        'import/no-unassigned-import': 'off',
        'require-atomic-updates': 'off',
      },
    },
  ],

  env: {
    browser: true,
    node: true,
  },

  ignorePatterns: [
    '!.prettierrc.js',
    '**/!.eslintrc.js',
    'dist',
    'lavamoat',
    'packages',
    'src/app/hw/ledger/ledger-keyring.*',
    'test/playwright/chrome/**/*',
    'test/playwright/playwright-reports/**/*',
    'submodules',
    'types',
  ],
};
