import { Duplex, Readable, Writable } from 'stream';
import { MESSAGE_ACKNOWLEDGE } from '../constants';

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

export const waitForAcknowledge = async (stream: Readable) => {
  await waitForMessage(stream, (data) =>
    Promise.resolve(data === MESSAGE_ACKNOWLEDGE),
  );
};

export const acknowledge = (stream: Writable) => {
  stream.write(MESSAGE_ACKNOWLEDGE);
};

export const addDataListener = (
  stream: Readable,
  listener: (data: any) => void,
) => {
  stream.on('data', (data: any) => {
    if (data === MESSAGE_ACKNOWLEDGE) {
      return;
    }

    listener(data);
  });
};

export class DuplexCopy extends Duplex {
  private stream: Duplex;

  constructor(stream: Duplex) {
    super({ objectMode: true });

    this.stream = stream;

    this.stream.on('data', (data: any) => {
      this.onMessage(data);
    });
  }

  private onMessage(data: any) {
    this.push(data);
  }

  public _read() {
    return null;
  }

  public _write(
    msg: any,
    encoding: BufferEncoding | undefined,
    cb: () => void,
  ) {
    this.stream.write(msg, encoding, cb);
  }
}
