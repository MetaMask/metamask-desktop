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
    plugins: [
      ['./code-fencing-babel', { buildType: 'desktopapp' }],
      'transform-inline-environment-variables',
    ],
    ignore: [
      'dist',
      'dist_desktop',
      'dist_desktop_ui',
      'builds_desktop',
      'builds',
      'development',
      'node_modules',
      'test',
      '.storybook',
      'types',
      '*.config.js',
      '**/*.test.js',
      'storybook-build',
      '.yarn',
    ],
  };
};
