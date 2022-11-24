import { GAS_ESTIMATE_TYPES } from '../../shared/constants/gas';
import { getInitialSendStateWithExistingTxState } from '../../test/jest/mocks';
import {
  getCustomGasLimit,
  getCustomGasPrice,
  isCustomPriceSafe,
  isCustomPriceExcessive,
} from './custom-gas';

describe('custom-gas selectors', () => {
  describe('getCustomGasPrice()', () => {
    it('should return gas.customData.price', () => {
      const mockState = {
        gas: { customData: { price: 'mockPrice' } },
      };
      expect(getCustomGasPrice(mockState)).toStrictEqual('mockPrice');
    });
  });
  describe('isCustomGasPriceSafe()', () => {
    it('should return true for gas.customData.price 0x77359400', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            low: '1',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: '0x77359400' },
        },
      };
      expect(isCustomPriceSafe(mockState)).toStrictEqual(true);
    });
    it('should return true for gas.customData.price null', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            low: '1',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: null },
        },
      };
      expect(isCustomPriceSafe(mockState)).toStrictEqual(true);
    });
    it('should return true gas.customData.price undefined', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            low: '1',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: undefined },
        },
      };
      expect(isCustomPriceSafe(mockState)).toStrictEqual(true);
    });
    it('should return false gas.basicEstimates.safeLow undefined', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.NONE,
          gasFeeEstimates: {
            low: undefined,
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: '0x77359400' },
        },
      };
      expect(isCustomPriceSafe(mockState)).toStrictEqual(false);
    });
  });

  describe('isCustomPriceExcessive()', () => {
    it('should return false for gas.customData.price null', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '150',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: null },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return false gas.basicEstimates.fast undefined', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: undefined,
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: '0x77359400' },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return false gas.basicEstimates.price 0x205d0bae00 (139)', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '139',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: '0x205d0bae00' },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return false gas.basicEstimates.price 0x1bf08eb000 (120)', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '139',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: '0x1bf08eb000' },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return false gas.basicEstimates.price 0x28bed01600 (175)', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '139',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: '0x28bed01600' },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return true gas.basicEstimates.price 0x30e4f9b400 (210)', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '139',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: '0x30e4f9b400' },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(true);
    });
    it('should return false gas.basicEstimates.price 0x28bed01600 (175) (checkSend=true)', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '139',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        send: getInitialSendStateWithExistingTxState({
          gas: {
            gasPrice: '0x28bed0160',
          },
        }),
        gas: {
          customData: { price: null },
        },
      };
      expect(isCustomPriceExcessive(mockState, true)).toStrictEqual(false);
    });
    it('should return true gas.basicEstimates.price 0x30e4f9b400 (210) (checkSend=true)', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '139',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        send: getInitialSendStateWithExistingTxState({
          gas: {
            gasPrice: '0x30e4f9b400',
          },
        }),
        gas: {
          customData: { price: null },
        },
      };
      expect(isCustomPriceExcessive(mockState, true)).toStrictEqual(true);
    });
  });

  describe('getCustomGasLimit()', () => {
    it('should return gas.customData.limit', () => {
      const mockState = { gas: { customData: { limit: 'mockLimit' } } };
      expect(getCustomGasLimit(mockState)).toStrictEqual('mockLimit');
    });
  });
});
