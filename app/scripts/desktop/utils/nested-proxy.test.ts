import {
  PROPERTY_2_MOCK,
  PROPERTY_MOCK,
  VALUE_2_MOCK,
  VALUE_MOCK,
} from '../test/mocks';
import { NestedProxy } from './nested-proxy';

describe('Nested Proxy', () => {
  const getOverrideMock = jest.fn();
  const functionOverrideMock = jest.fn();
  const functionMock = () => VALUE_MOCK;
  const argsMock = ['test', 123];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('get', () => {
    let nestedProxy: NestedProxy;

    beforeEach(() => {
      nestedProxy = new NestedProxy({ getOverride: getOverrideMock });
    });

    it.each([
      ['existing', { [PROPERTY_MOCK]: VALUE_MOCK }, VALUE_MOCK],
      ['missing', {}, undefined],
    ])(
      'intercepts %s top level property',
      (_, originalData: any, expectedOriginalValue: any) => {
        const proxy = new Proxy(originalData, nestedProxy);

        getOverrideMock.mockReturnValueOnce(VALUE_2_MOCK);

        expect(proxy[PROPERTY_MOCK]).toStrictEqual(VALUE_2_MOCK);

        expect(getOverrideMock).toHaveBeenCalledTimes(1);
        expect(getOverrideMock).toHaveBeenCalledWith(
          [PROPERTY_MOCK],
          expectedOriginalValue,
        );
      },
    );

    it.each([
      [
        'existing',
        { [PROPERTY_MOCK]: { [PROPERTY_2_MOCK]: VALUE_MOCK } },
        VALUE_MOCK,
      ],
      ['missing', { [PROPERTY_MOCK]: {} }, undefined],
    ])(
      'intercepts %s nested property',
      (_, originalData: any, expectedOriginalValue: any) => {
        const proxy = new Proxy(originalData, nestedProxy);

        getOverrideMock.mockImplementationOnce(
          (__, originalValue) => originalValue,
        );

        getOverrideMock.mockReturnValueOnce(VALUE_2_MOCK);

        expect(proxy[PROPERTY_MOCK][PROPERTY_2_MOCK]).toStrictEqual(
          VALUE_2_MOCK,
        );

        expect(getOverrideMock).toHaveBeenCalledTimes(2);
        expect(getOverrideMock).toHaveBeenLastCalledWith(
          [PROPERTY_MOCK, PROPERTY_2_MOCK],
          expectedOriginalValue,
        );
      },
    );

    it.each([
      [
        'existing',
        {
          [PROPERTY_MOCK]: {
            [PROPERTY_2_MOCK]: { [PROPERTY_MOCK]: VALUE_MOCK },
          },
        },
        VALUE_MOCK,
      ],
      [
        'non-existant',
        { [PROPERTY_MOCK]: { [PROPERTY_2_MOCK]: {} } },
        undefined,
      ],
    ])(
      'intercepts %s multi-nested property',
      (_, originalData: any, expectedOriginalValue: any) => {
        const proxy = new Proxy(originalData, nestedProxy);

        getOverrideMock.mockImplementationOnce(
          (__, originalValue) => originalValue,
        );

        getOverrideMock.mockImplementationOnce(
          (__, originalValue) => originalValue,
        );

        getOverrideMock.mockReturnValueOnce(VALUE_2_MOCK);

        expect(
          proxy[PROPERTY_MOCK][PROPERTY_2_MOCK][PROPERTY_MOCK],
        ).toStrictEqual(VALUE_2_MOCK);

        expect(getOverrideMock).toHaveBeenCalledTimes(3);
        expect(getOverrideMock).toHaveBeenLastCalledWith(
          [PROPERTY_MOCK, PROPERTY_2_MOCK, PROPERTY_MOCK],
          expectedOriginalValue,
        );
      },
    );

    it('intercepts multi-nested property with missing parent properties', () => {
      const proxy = new Proxy({}, nestedProxy);

      getOverrideMock.mockImplementationOnce(() => undefined);
      getOverrideMock.mockImplementationOnce(() => undefined);
      getOverrideMock.mockReturnValueOnce(VALUE_2_MOCK);

      expect(
        proxy[PROPERTY_MOCK][PROPERTY_2_MOCK][PROPERTY_MOCK],
      ).toStrictEqual(VALUE_2_MOCK);

      expect(getOverrideMock).toHaveBeenCalledTimes(3);
      expect(getOverrideMock).toHaveBeenLastCalledWith(
        [PROPERTY_MOCK, PROPERTY_2_MOCK, PROPERTY_MOCK],
        undefined,
      );
    });
  });

  describe('call', () => {
    let nestedProxy: NestedProxy;

    beforeEach(() => {
      nestedProxy = new NestedProxy({ functionOverride: functionOverrideMock });
    });

    it.each([
      ['existing', { [PROPERTY_MOCK]: functionMock }, functionMock],
      ['missing', {}, undefined],
    ])(
      'intercepts %s top level property',
      (_, originalData: any, expectedOriginalFunction: any) => {
        const proxy = new Proxy(originalData, nestedProxy);

        functionOverrideMock.mockReturnValueOnce(VALUE_2_MOCK);

        expect(proxy[PROPERTY_MOCK](...argsMock)).toStrictEqual(VALUE_2_MOCK);

        expect(functionOverrideMock).toHaveBeenCalledTimes(1);
        expect(functionOverrideMock).toHaveBeenCalledWith(
          [PROPERTY_MOCK],
          argsMock,
          expectedOriginalFunction,
        );
      },
    );

    it.each([
      [
        'existing',
        { [PROPERTY_MOCK]: { [PROPERTY_2_MOCK]: functionMock } },
        functionMock,
      ],
      ['missing', { [PROPERTY_MOCK]: {} }, undefined],
    ])(
      'intercepts %s nested property',
      (_, originalData: any, expectedOriginalFunction: any) => {
        const proxy = new Proxy(originalData, nestedProxy);

        functionOverrideMock.mockReturnValueOnce(VALUE_2_MOCK);

        expect(
          proxy[PROPERTY_MOCK][PROPERTY_2_MOCK](...argsMock),
        ).toStrictEqual(VALUE_2_MOCK);

        expect(functionOverrideMock).toHaveBeenCalledTimes(1);
        expect(functionOverrideMock).toHaveBeenLastCalledWith(
          [PROPERTY_MOCK, PROPERTY_2_MOCK],
          argsMock,
          expectedOriginalFunction,
        );
      },
    );

    it.each([
      [
        'existing',
        {
          [PROPERTY_MOCK]: {
            [PROPERTY_2_MOCK]: { [PROPERTY_MOCK]: functionMock },
          },
        },
        functionMock,
      ],
      ['missing', { [PROPERTY_MOCK]: { [PROPERTY_2_MOCK]: {} } }, undefined],
    ])(
      'intercepts %s multi-nested property',
      (_, originalData: any, expectedOriginalFunction: any) => {
        const proxy = new Proxy(originalData, nestedProxy);

        functionOverrideMock.mockReturnValueOnce(VALUE_2_MOCK);

        expect(
          proxy[PROPERTY_MOCK][PROPERTY_2_MOCK][PROPERTY_MOCK](...argsMock),
        ).toStrictEqual(VALUE_2_MOCK);

        expect(functionOverrideMock).toHaveBeenCalledTimes(1);
        expect(functionOverrideMock).toHaveBeenLastCalledWith(
          [PROPERTY_MOCK, PROPERTY_2_MOCK, PROPERTY_MOCK],
          argsMock,
          expectedOriginalFunction,
        );
      },
    );

    it('intercepts multi-nested property with missing parent properties', () => {
      const proxy = new Proxy({}, nestedProxy);

      functionOverrideMock.mockReturnValueOnce(VALUE_2_MOCK);

      expect(
        proxy[PROPERTY_MOCK][PROPERTY_2_MOCK][PROPERTY_MOCK](...argsMock),
      ).toStrictEqual(VALUE_2_MOCK);

      expect(functionOverrideMock).toHaveBeenCalledTimes(1);
      expect(functionOverrideMock).toHaveBeenLastCalledWith(
        [PROPERTY_MOCK, PROPERTY_2_MOCK, PROPERTY_MOCK],
        argsMock,
        undefined,
      );
    });
  });
});
