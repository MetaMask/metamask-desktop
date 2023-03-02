const { version: reactVersion } = require('react/package.json');

module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    babelOptions: { configFile: './babel-ui.config.js' },
  },
  plugins: ['@babel', 'react'],
  extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
  rules: {
    'no-shadow': 'off',
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/require-description': 'off',
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
    'import/resolver': {
      // When determining the location of an `import`, prefer TypeScript's
      // resolution algorithm. Note that due to how we've configured
      // TypeScript in `tsconfig.json`, we are able to import JavaScript
      // files from TypeScript files.
      typescript: {
        // Always try to resolve types under `<root>/@types` directory even
        // it doesn't contain any source code, like `@types/unist`
        alwaysTryTypes: true,
      },
    },
  },
  overrides: [
    {
      files: ['src/ui/**/*.ts'],
      extends: ['.eslintrc.typescript.js'],
    },
  ],
  env: {
    browser: true,
    node: true,
  },
  globals: {
    __electronLog: 'readonly',
  },
};
