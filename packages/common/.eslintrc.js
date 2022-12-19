module.exports = {
  root: true,

  extends: ['@metamask/eslint-config'],

  overrides: [
    {
      files: ['**/*.js'],
      extends: ['@metamask/eslint-config-nodejs'],
    },
    {
      files: ['**/*.ts'],
      extends: ['@metamask/eslint-config-typescript'],
      rules: {
        'jsdoc/require-jsdoc': 'off',
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

  ignorePatterns: ['!.prettierrc.js', '**/!.eslintrc.js', 'dist'],
};
