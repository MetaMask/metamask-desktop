module.exports = function (api) {
  const isUnitTest = api.env('test');
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
    plugins: isUnitTest
      ? []
      : [
          ['./build/code-fencing-babel', { buildType: 'desktopapp' }],
          'transform-inline-environment-variables',
        ],
    ignore: [
      '**/*.config.js',
      '**/*.test.js',
      '**/node_modules',
      'build/code-fencing-babel.js',
      'dist',
      'packages',
      'playwright',
      'submodules/extension/.storybook',
      'submodules/extension/.yarn',
      'submodules/extension/builds',
      'submodules/extension/development',
      'submodules/extension/dist',
      'submodules/extension/node_modules',
      'submodules/extension/storybook-build',
      'submodules/extension/test',
      'submodules/extension/types',
    ],
  };
};
