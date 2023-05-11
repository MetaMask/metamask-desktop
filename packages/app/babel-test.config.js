module.exports = function (api) {
  api.cache(false);
  return {
    parserOpts: {
      strictMode: true,
    },
    targets: {
      electron: '23',
    },
    presets: ['@babel/preset-typescript', '@babel/preset-env'],
    plugins: [],
    ignore: [
      '**/*.config.js',
      '**/node_modules',
      'build/code-fencing-babel.js',
      'dist',
      'build',
      'packages',
      'playwright',
      'submodules/extension/.storybook',
      'submodules/extension/.yarn',
      'submodules/extension/builds',
      'submodules/extension/development',
      'submodules/extension/dist',
      'submodules/extension/node_modules',
      'submodules/extension/storybook-build',
      'submodules/extension/types',
    ],
  };
};
