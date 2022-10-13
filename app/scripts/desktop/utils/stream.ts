import { Readable } from 'stream';

export const waitForMessage = <T>(
  stream: Readable,
  filter?: (data: T) => Promise<any>,
  { returnFilterOutput = false } = {},
): Promise<T> => {
  return new Promise((resolve) => {
    const listener = async (data: T) => {
      const isMatch = filter ? await filter(data) : Promise.resolve(true);

      if (isMatch) {
        stream.removeListener('data', listener);
        resolve(returnFilterOutput ? isMatch : data);
      }
    };

    stream.on('data', listener);
  });
};
