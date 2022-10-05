import { v4 as uuidv4 } from 'uuid';

export const flattenMessage = (data: any) => {
  let output;

  try {
    const stream = data.name;
    const multiplexData = data.data;
    const nestedStream = multiplexData?.name;
    const nestedData = multiplexData?.data;
    const method = nestedData?.method;
    const result = nestedData?.result;

    output = {};
    output = { ...output, ...(stream ? { stream } : {}) };
    output = { ...output, ...(nestedStream ? { type: nestedStream } : {}) };
    output = { ...output, ...(method ? { method } : {}) };
    output = { ...output, ...(result ? { isResult: true } : {}) };
  } catch {
    output = data;
  }

  return output;
};

export const timeoutPromise = <T>(
  promise: Promise<T>,
  timeout: number,
  errorMessage?: string,
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    let complete = false;

    const timeoutInstance = setTimeout(() => {
      complete = true;

      reject(new Error(errorMessage || `Promise timeout after ${timeout}ms`));
    }, timeout);

    promise.then((value: T) => {
      if (complete) {
        return;
      }

      clearTimeout(timeoutInstance);
      resolve(value);
    });
  });
};

export const uuid = uuidv4;
