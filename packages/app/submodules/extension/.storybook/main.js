const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const { generateIconNames } = require('../development/generate-icon-names');

module.exports = {
  stories: [
    '../ui/**/*.stories.js',
    '../ui/**/*.stories.mdx',
    './*.stories.mdx',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-actions',
    '@storybook/addon-a11y',
    '@storybook/addon-knobs',
    './i18n-party-addon/register.js',
    'storybook-dark-mode',
  ],
  staticDirs: ['../app', './images'],
  // Uses babel.config.js settings and prevents "Missing class properties transform" error
  babel: async (options) => ({ overrides: options.overrides }),
  // Sets env variables https://storybook.js.org/docs/react/configure/environment-variables/
  env: async (config) => {
    return {
      ...config,
      // Creates the icon names environment variable for the component-library/icon/icon.js component
      ICON_NAMES: await generateIconNames(),
    };
  },
  webpackFinal: async (config) => {
    config.context = process.cwd();
    config.node = {
      __filename: true,
      __dirname: false,
      fs: 'empty'
    };
    config.resolve.alias['webextension-polyfill'] = require.resolve(
      './__mocks__/webextension-polyfill.js',
    );
    config.resolve.alias['fs/promises'] = require.resolve(
      './__mocks__/fs-promises.js',
    );
    config.module.strictExportPresence = true;
    config.module.rules.push({
      test: /\.scss$/,
      loaders: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            import: false,
            url: false,
          },
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            implementation: require('sass'),
            sassOptions: {
              includePaths: ['ui/css/'],
            },
          },
        },
      ],
    });
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(
              'node_modules',
              '@fortawesome',
              'fontawesome-free',
              'webfonts',
            ),
            to: path.join('fonts', 'fontawesome'),
          },
        ],
      }),
    );
    return config;
  },
};
