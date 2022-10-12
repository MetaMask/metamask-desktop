const blacklistedHosts = [
  'goerli.infura.io',
  'mainnet.infura.io',
  'sepolia.infura.io',
];

async function setupMocking(server, testSpecificMock) {
  await server.forAnyRequest().thenPassThrough({
    beforeRequest: (req) => {
      const { host } = req.headers;
      if (blacklistedHosts.includes(host)) {
        return {
          url: 'http://localhost:8545',
        };
      }
      return {};
    },
  });

  await server.forPost('https://api.segment.io/v1/batch').thenCallback(() => {
    return {
      statusCode: 200,
    };
  });

  await server
    .forPost('https://sentry.io/api/0000000/envelope/')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    });

  await server
    .forPost('https://sentry.io/api/0000000/store/')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    });

  await server
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 1,
              created_at: null,
              text_signature: 'deposit()',
              hex_signature: null,
              bytes_signature: null,
            },
          ],
        },
      };
    });

  await server
    .forGet('https://gas-api.metaswap.codefi.network/networks/1/gasPrices')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          SafeGasPrice: '1',
          ProposeGasPrice: '2',
          FastGasPrice: '3',
        },
      };
    });

  await server
    .forGet(
      'https://gas-api.metaswap.codefi.network/networks/1/suggestedGasFees',
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          low: {
            suggestedMaxPriorityFeePerGas: '1',
            suggestedMaxFeePerGas: '20.44436136',
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 30000,
          },
          medium: {
            suggestedMaxPriorityFeePerGas: '1.5',
            suggestedMaxFeePerGas: '25.80554517',
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 45000,
          },
          high: {
            suggestedMaxPriorityFeePerGas: '2',
            suggestedMaxFeePerGas: '27.277766977',
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 60000,
          },
          estimatedBaseFee: '19.444436136',
          networkCongestion: 0.14685,
          latestPriorityFeeRange: ['0.378818859', '6.555563864'],
          historicalPriorityFeeRange: ['0.1', '248.262969261'],
          historicalBaseFeeRange: ['14.146999781', '28.825256275'],
          priorityFeeTrend: 'down',
          baseFeeTrend: 'up',
        },
      };
    });

  await server
    .forGet('https://swap.metaswap.codefi.network/featureFlags')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: [
          {
            ethereum: {
              fallbackToV1: false,
              mobileActive: true,
              extensionActive: true,
            },
            bsc: {
              fallbackToV1: false,
              mobileActive: true,
              extensionActive: true,
            },
            polygon: {
              fallbackToV1: false,
              mobileActive: true,
              extensionActive: true,
            },
            avalanche: {
              fallbackToV1: false,
              mobileActive: true,
              extensionActive: true,
            },
            smartTransactions: {
              mobileActive: false,
              extensionActive: false,
            },
            updated_at: '2022-03-17T15:54:00.360Z',
          },
        ],
      };
    });

  await server
    .forGet('https://token-api.metaswap.codefi.network/tokens/1337')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: [
          {
            address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
            symbol: 'BAT',
            decimals: 18,
            name: 'Basic Attention Token',
            iconUrl:
              'https://assets.coingecko.com/coins/images/677/thumb/basic-attention-token.png?1547034427',
            aggregators: [
              'aave',
              'bancor',
              'coinGecko',
              'oneInch',
              'paraswap',
              'pmm',
              'zapper',
              'zerion',
              'zeroEx',
            ],
            occurrences: 9,
          },
        ],
      };
    });

  await server
    .forGet('https://token-api.metaswap.codefi.network/token/0x539')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    });

  await server
    .forGet(
      'https://static.metaswap.codefi.network/api/v1/tokenIcons/1337/0x0d8775f648430679a709e98d2b0cb6250d2887ef.png',
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });

  await server
    .forGet(
      'https://static.metaswap.codefi.network/api/v1/tokenIcons/1337/0x2efa2cb29c2341d8e5ba7d3262c9e9d6f1bf3711.png',
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });

  await server
    .forGet('https://min-api.cryptocompare.com/data/price')
    .withQuery({ fsym: 'ETH', tsyms: 'USD' })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          USD: '1700',
        },
      };
    });

  testSpecificMock(server);
}

module.exports = { setupMocking };
