module.exports = {
  extends: ['@metamask/eslint-config-jest'],
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['test/**/*.js', '**/*.{test,spec}.js'],
      extends: ['.eslintrc.node.js'],
      parserOptions: {
        ecmaVersion: 11,
        sourceType: 'module',
      },
    },
    {
      files: ['test/**/*.ts', '**/*.{test,spec}.ts'],
      extends: ['.eslintrc.typescript.js'],
      parserOptions: {
        ecmaVersion: 11,
        sourceType: 'module',
      },
    },
  ],
  rules: {
    'jest/lowercase-name': 'off',
    'jest/prefer-to-be': 'off',
    'jest/no-standalone-expect': 'warn',
    'jest/prefer-strict-equal': 'warn',
  },
  env: {
    browser: true,
    node: true,
  },
};
