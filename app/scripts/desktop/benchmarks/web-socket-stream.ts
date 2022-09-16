import { Duplex } from 'stream';
import WS from 'ws';
import EncryptedWebSocketStream from '../encrypted-web-socket-stream';
import {
  BrowserWebSocket,
  NodeWebSocket,
  WebSocketStream,
} from '../web-socket-stream';
import { run } from './utils';

const DATA =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

const createWebSocketServer = async (): Promise<WS.Server> => {
  return new Promise((resolve) => {
    const server = new WS.Server({ port: 123 }, () => {
      setImmediate(() => resolve(server));
    });
  });
};

const test = async <T extends Duplex & { init: any }>(
  iterations: number,
  start: () => void,
  createStream: (webSocket: BrowserWebSocket | NodeWebSocket) => T,
) => {
  const server = await createWebSocketServer();
  let serverStream: T;
  let count = 0;
  let resolver: any;
  const promise = new Promise((resolve) => {
    resolver = resolve as any;
  });

  server.on('connection', async (webSocket) => {
    serverStream = createStream(webSocket);
    await serverStream.init();

    serverStream.on('data', (_) => {
      if (count < iterations) {
        serverStream.write(DATA);
        count += 1;
      } else {
        server.close();
        resolver();
      }
    });
  });

  const clientStream = createStream(new WS('ws://localhost:123'));
  await clientStream.init();

  clientStream.on('data', (_) => {
    if (count < iterations) {
      clientStream.write(DATA);
      count += 1;
    } else {
      server.close();
      resolver();
    }
  });

  start();

  clientStream.write(DATA);
  count += 1;

  return promise;
};

const standard = async (iterations: number, start: () => void) => {
  await test(iterations, start, (webSocket) => new WebSocketStream(webSocket));
};

const encrypted = async (iterations: number, start: () => void) => {
  await test(
    iterations,
    start,
    (webSocket) => new EncryptedWebSocketStream(webSocket),
  );
};

run([
  { name: 'Standard', test: standard },
  { name: 'Encrypted', test: encrypted },
]);
