const { version: reactVersion } = require('react/package.json');

module.exports = {
  root: true,

  extends: ['@metamask/eslint-config'],

  overrides: [
    {
      files: ['src/**/*.js', 'ui/**/*.js', 'test/**/*.js'],
      extends: ['@metamask/eslint-config-nodejs'],
      rules: {
        'no-shadow': 'off',
        'jsdoc/require-jsdoc': 'warn',
      },
      parserOptions: {
        ecmaVersion: 11,
        sourceType: 'module',
      },
    },
    {
      files: ['**/*.ts'],
      extends: ['@metamask/eslint-config-typescript'],
      rules: {
        '@typescript-eslint/no-shadow': 'off',
        'import/no-unassigned-import': 'off',
        'jsdoc/require-jsdoc': 'off',
        'spaced-comment': 'off',
      },
    },
    /**
     * React-specific code
     *
     * Code in this category contains JSX and hence needs to be run through the
     * React plugin.
     */
    {
      files: ['ui/**/*.js'],
      excludedFiles: ['ui/**/*.test.js'],
      parser: '@babel/eslint-parser',
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        babelOptions: { configFile: './babel-ui.config.js' },
      },
      plugins: ['@babel', 'react'],
      rules: {
        'react/no-unused-prop-types': 'error',
        'react/no-unused-state': 'error',
        'react/jsx-boolean-value': 'error',
        'react/jsx-curly-brace-presence': [
          'error',
          {
            props: 'never',
            children: 'never',
          },
        ],
        'react/no-deprecated': 'error',
        'react/default-props-match-prop-types': 'error',
        'react/jsx-no-duplicate-props': 'error',
        '@babel/no-invalid-this': 'error',
        '@babel/semi': 'off',
        'jsdoc/require-jsdoc': 'off',
        'node/no-unpublished-require': 'off',
        'default-param-last': 'off',
        'prefer-object-spread': 'error',
        'node/no-process-env': 'off',
      },
      settings: {
        react: {
          // If this is set to 'detect', ESLint will import React in order to
          // find its version. Because we run ESLint in the build system under
          // LavaMoat, this means that detecting the React version requires a
          // LavaMoat policy for all of React, in the build system. That's a
          // no-go, so we grab it from React's package.json.
          version: reactVersion,
        },
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.js'],
      extends: ['@metamask/eslint-config-jest'],
      rules: {
        'jest/lowercase-name': 'off',
        'jest/prefer-to-be': 'off',
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
    'src/hw/ledger/ledger-keyring.*',
    'test/playwright/chrome/**/*',
    'test/playwright/playwright-reports/**/*',
    'submodules',
    'types',
  ],
};
