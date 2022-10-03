export type GetOverride = (key: string[], originalValue?: any) => any;

export type FunctionOverride = (
  key: string[],
  args: any[],
  originalFunction?: (...originalArgs: any[]) => any,
) => any;

export class NestedProxy {
  private parentKey: string[];

  private originalFunction?: (...originalArgs: any[]) => any;

  private getOverride: GetOverride;

  private functionOverride: FunctionOverride;

  constructor({
    parentKey = [],
    originalFunction,
    getOverride = (_, originalValue) => originalValue,
    functionOverride = (_, args, original) => original?.(...args),
  }: {
    parentKey?: string[];
    originalFunction?: (...args: any[]) => any;
    getOverride?: GetOverride;
    functionOverride?: FunctionOverride;
  }) {
    this.parentKey = parentKey;
    this.originalFunction = originalFunction;
    this.getOverride = getOverride;
    this.functionOverride = functionOverride;
  }

  public get(target: any, key: string): any {
    const fullKey = [...this.parentKey, key];
    const targetValue = target[key];
    const targetValueExists = key in target;
    const newValue = this.getOverride(fullKey, targetValue);
    const isObjectNewValue = typeof newValue === 'object';
    const isFunctionNewValue = typeof newValue === 'function';

    const newProxy = new NestedProxy({
      parentKey: fullKey,
      originalFunction: isFunctionNewValue ? newValue : undefined,
      getOverride: this.getOverride,
      functionOverride: this.functionOverride,
    });

    if (newValue === undefined && !targetValueExists) {
      return new Proxy(() => undefined, newProxy);
    }

    if (isObjectNewValue || isFunctionNewValue) {
      return new Proxy(newValue, newProxy);
    }

    return newValue;
  }

  public apply(_: any, __: any, args: any[]) {
    return this.functionOverride(this.parentKey, args, this.originalFunction);
  }
}
