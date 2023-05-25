const path = require('path');
const { readFile } = require('fs/promises');

const configurationPropertyNames = ['SENTRY_DSN'];

/**
 * Get configuration for non-production builds.
 *
 * @returns {Promise<object>} The production configuration.
 */
async function getConfig() {
  const configPath = path.resolve(__dirname, '..', '..', '.env');
  let configContents = '';
  try {
    configContents = await readFile(configPath, {
      encoding: 'utf8',
    });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const environmentVariables = {};
  for (const propertyName of configurationPropertyNames) {
    if (process.env[propertyName]) {
      environmentVariables[propertyName] = process.env[propertyName];
    }
  }

  const configVariables = configContents
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .reduce((result, line) => {
      const lineParts = line.split('=');
      const variableName = lineParts[0];
      let value = lineParts[1];

      if (value === 'true') {
        value = true;
      }

      result[variableName] = value;
      return result;
    }, {});

  return {
    ...configVariables,
    ...environmentVariables,
  };
}

module.exports = { getConfig };
