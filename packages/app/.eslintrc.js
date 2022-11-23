module.exports = {
  root: true,

  extends: ['@metamask/eslint-config'],

  overrides: [
    {
      files: ['**/*.js'],
      extends: ['@metamask/eslint-config-nodejs'],
      rules: {
        'no-shadow': 'off',
      },
      parserOptions: {
        ecmaVersion: 11,
      },
    },
    {
      files: ['**/*.ts'],
      extends: ['@metamask/eslint-config-typescript'],
      rules: {
        '@typescript-eslint/no-shadow': 'off',
        'import/no-unassigned-import': 'off',
        'spaced-comment': 'off',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.js'],
      extends: ['@metamask/eslint-config-jest'],
      rules: {
        'jest/lowercase-name': 'off',
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
    'submodules',
    'types',
  ],
};
