module.exports = function (api) {
  api.cache(false);
  return {
    parserOpts: {
      strictMode: true,
    },
    targets: {
      browsers: ['chrome >= 66', 'firefox >= 68'],
    },
    presets: [
      '@babel/preset-typescript',
      '@babel/preset-env',
      '@babel/preset-react',
    ],
    plugins: [['./build/code-fencing-babel', { buildType: 'desktop' }]],
    ignore: [
      '**/*.config.js',
      '**/*.test.js',
      '**/node_modules',
      'build/code-fencing-babel.js',
      'dist',
      'build',
      'packages',
      'test',
      'playwright',
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
