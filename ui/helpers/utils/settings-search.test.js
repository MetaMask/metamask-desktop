import React from 'react';
import {
  getSettingsRoutes,
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from './settings-search';

const t = (key) => {
  switch (key) {
    case 'general':
      return 'General';
    case 'currencyConversion':
      return 'Currency conversion';
    case 'primaryCurrencySetting':
      return 'Primary currency';
    case 'primaryCurrencySettingDescription':
      return 'Select native to prioritize displaying values in the native currency of the chain (e.g. ETH). Select Fiat to prioritize displaying values in your selected fiat currency.';
    case 'currentLanguage':
      return 'Current language';
    case 'accountIdenticon':
      return 'Current language"';
    case 'hideZeroBalanceTokens':
      return 'Hide tokens without balance';
    case 'advanced':
      return 'Advanced';
    case 'stateLogs':
      return 'State logs';
    case 'stateLogsDescription':
      return 'State logs contain your public account addresses and sent transactions.';
    case 'syncWithMobile':
      return 'Sync with mobile';
    case 'resetAccount':
      return 'Reset account';
    case 'resetAccountDescription':
      return 'Resetting your account will clear your transaction history. This will not change the balances in your accounts or require you to re-enter your Secret Recovery Phrase.';
    case 'showAdvancedGasInline':
      return 'Advanced gas controls';
    case 'showAdvancedGasInlineDescription':
      return 'Select this to show gas price and limit controls directly on the send and confirm screens.';
    case 'showHexData':
      return 'Show hex data';
    case 'showHexDataDescription':
      return 'Select this to show the hex data field on the send screen';
    case 'showFiatConversionInTestnets':
      return 'Show conversion on test networks';
    case 'showFiatConversionInTestnetsDescription':
      return 'Select this to show fiat conversion on test network';
    case 'showTestnetNetworks':
      return 'Show test networks';
    case 'showTestnetNetworksDescription':
      return 'Select this to show test networks in network list';
    case 'nonceField':
      return 'Customize transaction nonce';
    case 'nonceFieldDescription':
      return 'Turn this on to change the nonce (transaction number) on confirmation screens. This is an advanced feature, use cautiously.';
    case 'autoLockTimeLimit':
      return 'Auto-lock timer (minutes)';
    case 'autoLockTimeLimitDescription':
      return 'Set the idle time in minutes before MetaMask will become locked.';
    case 'ipfsGateway':
      return 'IPFS Gateway';
    case 'ipfsGatewayDescription':
      return 'Enter the URL of the IPFS CID gateway to use for ENS content resolution.';
    case 'preferredLedgerConnectionType':
      return 'Preferred ledger connection type';
    case 'dismissReminderField':
      return 'Dismiss Secret Recovery Phrase backup reminder';
    case 'dismissReminderDescriptionField':
      return 'Turn this on to dismiss the Secret Recovery Phrase backup reminder message. We highly recommend that you back up your Secret Recovery Phrase to avoid loss of funds';
    case 'Contacts':
      return 'Contacts';
    case 'securityAndPrivacy':
      return 'Security & privacy';
    case 'revealSeedWords':
      return 'Reveal Secret Recovery Phrase';
    case 'showIncomingTransactions':
      return 'Show incoming transactions';
    case 'showIncomingTransactionsDescription':
      return 'Select this to use Etherscan to show incoming transactions in the transactions list';
    case 'usePhishingDetection':
      return 'Use phishing detection';
    case 'usePhishingDetectionDescription':
      return 'Display a warning for phishing domains targeting Ethereum users';
    case 'participateInMetaMetrics':
      return 'Participate in MetaMetrics';
    case 'participateInMetaMetricsDescription':
      return 'Participate in MetaMetrics to help us make MetaMask better';
    case 'alerts':
      return 'Alerts';
    case 'alertSettingsUnconnectedAccount':
      return 'Browsing a website with an unconnected account selected';
    case 'alertSettingsWeb3ShimUsage':
      return 'When a website tries to use the removed window.web3 API';
    case 'networks':
      return 'Networks';
    case 'mainnet':
      return 'Ethereum Mainnet';
    case 'goerli':
      return 'Goerli test network';
    case 'sepolia':
      return 'Sepolia test network';
    case 'localhost':
      return 'Localhost 8545';
    case 'experimental':
      return 'Experimental';
    case 'enhancedTokenDetection':
      return 'Enhanced token detection';
    case 'enhancedTokenDetectionDescription':
      return "ConsenSys' token API aggregates a list of tokens from various third party token lists. When turned on, tokens will be automatically detected, and searchable, on Ethereum mainnet, Binance, Polygon and Avalanche. When turned off, automatic detection and search can only be done on Ethereum mainnet.";
    case 'enableEIP1559V2':
      return 'Enable enhanced gas fee UI';
    case 'enableEIP1559V2Description':
      return "We've updated how gas estimation and customization works. Turn on if you'd like to use the new gas experience. Learn more";
    case 'enableOpenSeaAPI':
      return 'Enable OpenSea API';
    case 'enableOpenSeaAPIDescription':
      return "Use OpenSea's API to fetch NFT data. NFT auto-detection relies on OpenSea's API, and will not be available when this is turned off.";
    case 'useCollectibleDetection':
      return 'Autodetect NFTs';
    case 'useCollectibleDetectionDescription':
      return 'Displaying NFTs media & data may expose your IP address to centralized servers. Third-party APIs (like OpenSea) are used to detect NFTs in your wallet. This exposes your account address with those services. Leave this disabled if you don’t want the app to pull data from those those services.';
    case 'about':
      return 'About';
    case 'metamaskVersion':
      return 'MetaMask Version';
    case 'builtAroundTheWorld':
      return 'MetaMask is designed and built around the world.';
    case 'links':
      return 'Links';
    case 'privacyMsg':
      return 'Privacy policy';
    case 'terms':
      return 'Terms of use';
    case 'attributions':
      return 'Attributions';
    case 'supportCenter':
      return 'Visit our support center';
    case 'visitWebSite':
      return 'Visit our web site';
    case 'contactUs':
      return 'Contact us';
    case 'snaps':
      return 'Snaps';
    default:
      return '';
  }
};

describe('Settings Search Utils', () => {
  describe('settingsRoutes', () => {
    it('should be an array of settings routes objects', () => {
      expect(getSettingsRoutes().length).toBeGreaterThan(0);
    });
  });

  describe('getNumberOfSettingsInSection', () => {
    it('should get good general section number', () => {
      expect(getNumberOfSettingsInSection(t, t('general'))).toStrictEqual(6);
    });

    it('should get good advanced section number', () => {
      expect(getNumberOfSettingsInSection(t, t('advanced'))).toStrictEqual(15);
    });

    it('should get good contact section number', () => {
      expect(getNumberOfSettingsInSection(t, t('contacts'))).toStrictEqual(1);
    });

    it('should get good security & privacy section number', () => {
      expect(
        getNumberOfSettingsInSection(t, t('securityAndPrivacy')),
      ).toStrictEqual(4);
    });

    it('should get good alerts section number', () => {
      expect(getNumberOfSettingsInSection(t, t('alerts'))).toStrictEqual(2);
    });

    it('should get good network section number', () => {
      expect(getNumberOfSettingsInSection(t, t('networks'))).toStrictEqual(4);
    });

    it('should get good experimental section number', () => {
      expect(getNumberOfSettingsInSection(t, t('experimental'))).toStrictEqual(
        2,
      );
    });

    it('should get good about section number', () => {
      expect(getNumberOfSettingsInSection(t, t('about'))).toStrictEqual(9);
    });
  });

  // Can't be tested without DOM element
  describe('handleSettingsRefs', () => {
    it('should handle general refs', () => {
      const settingsRefs = Array(getNumberOfSettingsInSection(t, t('general')))
        .fill(undefined)
        .map(() => {
          return React.createRef();
        });
      expect(handleSettingsRefs(t, t('general'), settingsRefs)).toBeUndefined();
    });
  });
});
