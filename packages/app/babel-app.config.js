module.exports = function (api) {
  const isUnitTest = api.env('test');
  const isProd = api.env('production');
  api.cache(false);
  return {
    parserOpts: {
      strictMode: true,
    },
    targets: {
      electron: '22',
    },
    sourceMaps: isProd ? false : 'inline',
    presets: [
      '@babel/preset-typescript',
      '@babel/preset-env',
      '@babel/preset-react',
    ],
    plugins: isUnitTest
      ? []
      : [
          ['./build/code-fencing-babel', { buildType: 'desktop' }],
          [
            'transform-inline-environment-variables',
            { exclude: ['COMPATIBILITY_VERSION_DESKTOP_TEST'] },
          ],
        ],
    ignore: [
      'src/ui',
      '**/*.config.js',
      '**/*.test.js',
      '**/*.test.ts',
      '**/node_modules',
      'build/code-fencing-babel.js',
      'dist',
      'build',
      'packages',
      'test',
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
