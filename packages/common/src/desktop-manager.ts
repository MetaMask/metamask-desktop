import { Duplex } from 'stream';
import PortStream from 'extension-port-stream';
import endOfStream from 'end-of-stream';
import log from './utils/log';
import { browser } from './browser';
import { cfg } from './utils/config';
import {
  DesktopState,
  TestConnectionResult,
  ConnectionType,
  PairingKeyStatus,
} from './types';
import { BrowserWebSocket, WebSocketStream } from './web-socket-stream';
import { DuplexCopy } from './utils/stream';
import * as RawState from './utils/state';
import EncryptedWebSocketStream from './encryption/web-socket-stream';
import { timeoutPromise } from './utils/utils';
import { DESKTOP_HOOK_TYPES } from './constants';
import DesktopConnection from './desktop-connection';

const TIMEOUT_CONNECT = 10000;

const PAIRING_KEY_NOT_MATCH_ERROR_REASON = 'Desktop app is not recognized';
const PAIRING_KEY_NOT_MATCH_ERROR_CODE = 4000;

class DesktopManager {
  private desktopConnection?: DesktopConnection;

  private desktopState: DesktopState;

  private extensionVersion?: string;

  private transferredState = false;

  public constructor() {
    this.desktopState = {};
  }

  public async init(extensionVersion: string) {
    this.extensionVersion = extensionVersion;
  }

  public setState(state: any) {
    this.desktopState = state.DesktopController || {};
  }

  public async getConnection(): Promise<DesktopConnection | undefined> {
    if (!this.desktopState.desktopEnabled) {
      return undefined;
    }

    if (!this.desktopConnection) {
      await this.createConnection();
    }

    return this.desktopConnection;
  }

  public isDesktopEnabled(): boolean {
    return this.desktopState.desktopEnabled === true;
  }

  public async createStream(remotePort: any, connectionType: ConnectionType) {
    const uiStream = new PortStream(remotePort as any) as any as Duplex;
    uiStream.pause();
    uiStream.on('data', (data) => this.onUIMessage(data, uiStream));

    // Wrapping the original UI stream allows us to intercept messages required for error handling,
    // while still pausing messages from the UI until we are connected to the desktop.
    const uiInputStream = new DuplexCopy(uiStream);
    uiInputStream.pause();

    uiStream.resume();

    endOfStream(uiStream, () => {
      uiInputStream.destroy();
    });

    const desktopConnection = await this.getConnection();

    await desktopConnection?.createStream(
      remotePort,
      connectionType,
      uiInputStream,
    );
  }

  public async testConnection(): Promise<TestConnectionResult> {
    log.debug('Testing desktop connection');

    try {
      const connection =
        this.desktopConnection || (await this.createConnection());

      const versionCheckResult = await connection.checkVersions();

      const pairingKeyResult = await connection.checkPairingKey();

      log.debug('Connection test completed');

      return {
        isConnected: true,
        versionCheck: versionCheckResult,
        pairingKeyCheck: pairingKeyResult,
      };
    } catch (error: any) {
      log.debug('Connection test failed', error);
      return { isConnected: false };
    }
  }

  private async createConnection(): Promise<DesktopConnection> {
    const webSocket = await this.createWebSocket();

    const webSocketStream = cfg().webSocket.disableEncryption
      ? new WebSocketStream(webSocket)
      : new EncryptedWebSocketStream(webSocket);

    try {
      await webSocketStream.init({ startHandshake: true });
    } catch (error) {
      log.error('Failed to initialise web socket stream', error);
      webSocket.close();
      throw error;
    }

    const connection = new DesktopConnection(
      webSocketStream,
      this.extensionVersion as string,
    );

    webSocket.addEventListener('close', (event: CloseEvent) => {
      this.onDisconnect(webSocket, webSocketStream, connection, event.code);
    });

    log.debug('Created web socket connection');

    // returns connection if called by testConnection()
    if (!this.isDesktopEnabled()) {
      this.desktopConnection = connection;
      return connection;
    }

    if (!cfg().skipOtpPairingFlow) {
      log.debug('Desktop enabled, checking pairing key');

      const pairingKeyStatus = await connection.checkPairingKey();
      if ([PairingKeyStatus.NO_MATCH].includes(pairingKeyStatus)) {
        log.error(
          'The pairing key does not match, desktop app is not recognized',
        );

        webSocket.close(
          PAIRING_KEY_NOT_MATCH_ERROR_CODE,
          PAIRING_KEY_NOT_MATCH_ERROR_REASON,
        );
        throw new Error(PAIRING_KEY_NOT_MATCH_ERROR_REASON);
      }

      log.debug('Desktop app recognised');
    }

    connection.setPaired();
    await this.transferState(connection);

    this.desktopConnection = connection;

    return connection;
  }

  private async onDisconnect(
    webSocket: BrowserWebSocket,
    stream: Duplex,
    connection: DesktopConnection,
    closeEventCode: number,
  ) {
    log.debug('Desktop connection disconnected');

    stream.removeAllListeners();
    stream.destroy();

    webSocket.close();

    connection.removeAllListeners();

    if (connection === this.desktopConnection) {
      this.desktopConnection = undefined;
    }

    // Emit event to extension UI to show connection lost error
    // if close reason is not due "Desktop app is not recognized"
    if (closeEventCode !== PAIRING_KEY_NOT_MATCH_ERROR_CODE) {
      await browser?.runtime?.sendMessage?.({
        type: DESKTOP_HOOK_TYPES.DISCONNECT,
      });
    }
  }

  private async onUIMessage(data: any, stream: Duplex) {
    const method = data.data?.method;
    const id = data.data?.id;

    if (method === 'disableDesktopError') {
      await this.disable();
    }

    if (method === 'getDesktopEnabled') {
      stream.write({
        name: data.name,
        data: { jsonrpc: '2.0', result: true, id },
      });
    }
  }

  private async transferState(connection: DesktopConnection) {
    if (this.transferredState) {
      return;
    }

    if (!cfg().isExtensionTest) {
      await connection.transferState();
    }

    this.transferredState = true;
  }

  private async disable() {
    log.debug('Disabling desktop mode');

    await RawState.setDesktopState({
      desktopEnabled: false,
      pairingKey: undefined,
      pairingKeyHash: undefined,
    });

    browser.runtime.reload();
  }

  private async createWebSocket(): Promise<WebSocket> {
    const waitForWebSocketOpen = new Promise<BrowserWebSocket>((resolve) => {
      const webSocket = new WebSocket(`${cfg().webSocket.url}`);

      webSocket.addEventListener('open', () => {
        resolve(webSocket);
      });
    });

    return timeoutPromise(waitForWebSocketOpen, TIMEOUT_CONNECT, {
      errorMessage: 'Timeout connecting to web socket server',
    });
  }
}

export default new DesktopManager();
