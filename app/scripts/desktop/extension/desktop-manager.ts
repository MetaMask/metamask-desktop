import { Duplex } from 'stream';
import log from 'loglevel';
import PortStream from 'extension-port-stream';
import cfg from '../utils/config';
import { BrowserWebSocket, WebSocketStream } from '../shared/web-socket-stream';
import EncryptedWebSocketStream from '../encryption/encrypted-web-socket-stream';
import { timeoutPromise } from '../utils/utils';
import { TestConnectionResult } from '../types/desktop';
import * as RawState from '../utils/raw-state';
import { ConnectionType } from '../types/background';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
import DesktopConnection from './desktop-connection';

const TIMEOUT_CONNECT = 10000;

class DesktopManager {
  private desktopConnection?: DesktopConnection;

  public async init(state: any) {
    if (state?.DesktopController?.desktopEnabled === true) {
      this.desktopConnection = await this.createConnection();

      await this.desktopConnection.transferState();
    }

    log.debug('Initialised desktop manager');
  }

  public isDesktopEnabled(): boolean {
    return RawState.getCachedDesktopState().desktopEnabled === true;
  }

  public async getConnection(): Promise<DesktopConnection | undefined> {
    const desktopState = await RawState.getDesktopState();
    const { desktopEnabled } = desktopState;

    if (!desktopEnabled) {
      log.debug('Desktop not enabled, no connection');
      return undefined;
    }

    if (!this.desktopConnection) {
      await this.createConnection();
    }

    return this.desktopConnection;
  }

  public createStream = (
    remotePort: any,
    connectionType: ConnectionType,
  ): boolean => {
    if (!RawState.getCachedDesktopState().desktopEnabled) {
      return false;
    }

    const uiStream = new PortStream(remotePort as any) as any as Duplex;
    uiStream.pause();

    (async () => {
      const desktopConnection = await this.getConnection();

      await desktopConnection?.createStream(
        remotePort,
        connectionType,
        uiStream,
      );

      if (isManifestV3 && connectionType === ConnectionType.INTERNAL) {
        // When in Desktop Mode the responsibility to send CONNECTION_READY is on the desktop app side
        // Message below if captured by UI code in app/scripts/ui.js which will trigger UI initialisation
        // This ensures that UI is initialised only after background is ready
        // It fixes the issue of blank screen coming when extension is loaded, the issue is very frequent in MV3
        remotePort.postMessage({ name: 'CONNECTION_READY' });
      }
    })();

    return true;
  };

  public async testConnection(): Promise<TestConnectionResult> {
    log.debug('Testing desktop connection');

    try {
      const connection =
        this.desktopConnection || (await this.createConnection());

      const versionCheckResult = await connection.checkVersions();

      log.debug('Connection test successful');

      return { isConnected: true, versionCheck: versionCheckResult };
    } catch {
      log.debug('Connection test failed');
      return { isConnected: false };
    }
  }

  private async createConnection(): Promise<DesktopConnection> {
    const webSocket = await this.createWebSocket();

    const webSocketStream = cfg().desktop.webSocket.disableEncryption
      ? new WebSocketStream(webSocket)
      : new EncryptedWebSocketStream(webSocket);

    await webSocketStream.init({ startHandshake: true });

    const connection = new DesktopConnection(webSocketStream);

    webSocket.addEventListener('close', () =>
      this.onDisconnect(webSocket, webSocketStream, connection),
    );

    log.debug('Created web socket connection');

    this.desktopConnection = connection;

    return connection;
  }

  private onDisconnect(
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
  }

  private async createWebSocket(): Promise<WebSocket> {
    const waitForWebSocketOpen = new Promise<BrowserWebSocket>((resolve) => {
      const webSocket = new WebSocket(`${cfg().desktop.webSocket.url}`);

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
