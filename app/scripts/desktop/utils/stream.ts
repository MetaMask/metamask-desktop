import { Duplex, Readable } from 'stream';

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
