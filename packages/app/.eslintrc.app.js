module.exports = {
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['src/app/**/*.js'],
      extends: ['.eslintrc.node.js'],
      parserOptions: {
        ecmaVersion: 11,
        sourceType: 'module',
      },
    },
    {
      files: ['src/app/**/*.ts'],
      extends: ['.eslintrc.typescript.js'],
    },
  ],
  env: {
    node: true,
  },
};
