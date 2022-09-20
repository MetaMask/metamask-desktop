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

const waitForServerConnection = async (
  server: WS.Server,
): Promise<NodeWebSocket> => {
  return new Promise((resolve) => {
    const listener = async (webSocket: NodeWebSocket) => {
      server.removeListener('connection', listener);
      resolve(webSocket);
    };

    server.on('connection', listener);
  });
};

const waitForWebSocketOpen = async (
  webSocket: NodeWebSocket,
): Promise<void> => {
  return new Promise((resolve) => {
    const listener = async () => {
      webSocket.removeListener('open', listener);
      resolve();
    };

    webSocket.on('open', listener);
  });
};

const flushPromises = (): Promise<void> =>
  new Promise((resolve) => setImmediate(resolve));

const testTemplate = async <T extends Duplex & { init: any }>(
  iterations: number,
  start: () => void,
  createStream: (webSocket: BrowserWebSocket | NodeWebSocket) => T,
) => {
  let count = 0;
  let resolver: () => void;

  const promise = new Promise<void>((resolve) => {
    resolver = resolve;
  });

  const server = await createWebSocketServer();
  const serverConnectionPromise = waitForServerConnection(server);
  const clientWebSocket = new WS('ws://localhost:123');
  await waitForWebSocketOpen(clientWebSocket);
  const clientStream = createStream(clientWebSocket);
  const serverWebSocket = await serverConnectionPromise;
  const serverStream = createStream(serverWebSocket);
  await flushPromises();

  await Promise.all([
    serverStream.init({ startHandshake: false }),
    clientStream.init({ startHandshake: true }),
  ]);

  const onMessage = async (stream: Duplex) => {
    if (count < iterations) {
      stream.write(DATA);
      await flushPromises();
      count += 1;
    } else {
      server.close();
      resolver();
    }
  };

  clientStream.on('data', () => onMessage(clientStream));
  serverStream.on('data', () => onMessage(serverStream));

  start();

  clientStream.write(DATA);
  await flushPromises();

  count += 1;

  return promise;
};

const standard = async (iterations: number, start: () => void) => {
  await testTemplate(
    iterations,
    start,
    (webSocket) => new WebSocketStream(webSocket),
  );
};

const encrypted = async (iterations: number, start: () => void) => {
  await testTemplate(
    iterations,
    start,
    (webSocket) => new EncryptedWebSocketStream(webSocket),
  );
};

run([
  { name: 'Standard', test: standard },
  { name: 'Encrypted', test: encrypted },
]);
