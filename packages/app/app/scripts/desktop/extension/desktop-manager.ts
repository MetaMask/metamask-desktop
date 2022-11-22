import { Duplex } from 'stream';
import log from 'loglevel';
import PortStream from 'extension-port-stream';
import endOfStream from 'end-of-stream';
import { browser } from '@metamask/desktop/dist/browser';
import { cfg } from '@metamask/desktop/dist/utils/config';
import {
  DesktopState,
  TestConnectionResult,
  ConnectionType,
} from '@metamask/desktop/dist/types';
import {
  BrowserWebSocket,
  WebSocketStream,
} from '@metamask/desktop/dist/web-socket-stream';
import { DuplexCopy } from '@metamask/desktop/dist/utils/stream';
import * as RawState from '@metamask/desktop/dist/utils/state';
import EncryptedWebSocketStream from '@metamask/desktop/dist/encryption/web-socket-stream';
import { timeoutPromise } from '@metamask/desktop/dist/utils/utils';
import { DESKTOP_HOOK_TYPES } from '../../../../shared/constants/desktop';
import DesktopConnection from './desktop-connection';

const TIMEOUT_CONNECT = 10000;

class DesktopManager {
  private desktopConnection?: DesktopConnection;

  private desktopState: DesktopState;

  public constructor() {
    this.desktopState = {};
  }

  public async init(state: any) {
    if (state?.DesktopController?.desktopEnabled === true) {
      this.desktopConnection = await this.createConnection();

      if (!cfg().isTest) {
        await this.desktopConnection.transferState();
      }
    }

    log.debug('Initialised desktop manager');
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

      log.debug('Connection test completed');

      return { isConnected: true, versionCheck: versionCheckResult };
    } catch {
      log.debug('Connection test failed');
      return { isConnected: false };
    }
  }

  private async createConnection(): Promise<DesktopConnection> {
    const webSocket = await this.createWebSocket();

    const webSocketStream = cfg().webSocket.disableEncryption
      ? new WebSocketStream(webSocket)
      : new EncryptedWebSocketStream(webSocket);

    await webSocketStream.init({ startHandshake: true });

    const connection = new DesktopConnection(webSocketStream);

    webSocket.addEventListener('close', () =>
      this.onDisconnect(webSocket, webSocketStream, connection),
    );

    log.debug('Created web socket connection');

    if (!cfg().skipOtpPairingFlow && this.isDesktopEnabled()) {
      log.debug('Desktop enabled, checking pairing key');

      if (!(await connection.checkPairingKey())) {
        webSocket.close();
        throw new Error('Desktop app not recognized');
      }
    }

    this.desktopConnection = connection;

    return connection;
  }

  private async onDisconnect(
    webSocket: BrowserWebSocket,
    stream: Duplex,
    connection: DesktopConnection,
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
    await browser?.runtime?.sendMessage?.({
      type: DESKTOP_HOOK_TYPES.DISCONNECT,
    });
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

  private async disable() {
    log.debug('Disabling desktop mode');

    await RawState.setDesktopState({
      desktopEnabled: false,
      pairingKey: undefined,
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

    return timeoutPromise(
      waitForWebSocketOpen,
      TIMEOUT_CONNECT,
      'Timeout connecting to web socket server',
    );
  }
}

export default new DesktopManager();
