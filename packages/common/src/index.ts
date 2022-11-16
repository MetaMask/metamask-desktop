import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_DISABLE,
  CLIENT_ID_END_CONNECTION,
  CLIENT_ID_NEW_CONNECTION,
  CLIENT_ID_PAIRING,
  CLIENT_ID_STATE,
  CLIENT_ID_VERSION,
  CONNECTION_TYPE_EXTERNAL,
  CONNECTION_TYPE_INTERNAL,
  MESSAGE_ACKNOWLEDGE,
  MESSAGE_HANDSHAKE_FINISH,
  MESSAGE_HANDSHAKE_START,
} from './constants';

import {
  acknowledge,
  waitForAcknowledge,
  waitForMessage,
  DuplexCopy,
} from './utils/stream';

import {
  BrowserWebSocket,
  NodeWebSocket,
  WebSocketStream,
} from './web-socket-stream';

export type { BrowserWebSocket, NodeWebSocket };

export {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_DISABLE,
  CLIENT_ID_END_CONNECTION,
  CLIENT_ID_NEW_CONNECTION,
  CLIENT_ID_PAIRING,
  CLIENT_ID_STATE,
  CLIENT_ID_VERSION,
  CONNECTION_TYPE_EXTERNAL,
  CONNECTION_TYPE_INTERNAL,
  MESSAGE_ACKNOWLEDGE,
  MESSAGE_HANDSHAKE_FINISH,
  MESSAGE_HANDSHAKE_START,
  acknowledge,
  waitForAcknowledge,
  waitForMessage,
  DuplexCopy,
  WebSocketStream,
};
