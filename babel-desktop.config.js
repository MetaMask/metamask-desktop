module.exports = function (api) {
  api.cache(false);
  return {
    parserOpts: {
      strictMode: true,
    },
    targets: {
      electron: '20',
    },
    presets: [
      '@babel/preset-typescript',
      '@babel/preset-env',
      '@babel/preset-react',
    ],
    plugins: ['transform-inline-environment-variables'],
    ignore: [
      'dist',
      'dist_desktop',
      'builds_desktop',
      'development',
      'node_modules',
      'test',
      '.storybook',
      'types',
      '*.config.js',
      '**/*.test.js',
    ],
  };
};
