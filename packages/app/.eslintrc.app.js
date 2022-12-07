module.exports = {
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['src/**/*.js'],
      extends: ['.eslintrc.node.js'],
      parserOptions: {
        ecmaVersion: 11,
        sourceType: 'module',
      },
    },
    {
      files: ['src/**/*.ts'],
      extends: ['.eslintrc.typescript.js'],
    },
  ],
  env: {
    node: true,
  },
};
