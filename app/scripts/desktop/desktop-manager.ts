import { Duplex } from 'stream';
import EventEmitter from 'events';
import log from 'loglevel';
import { generate } from '../../../shared/modules/totp';
import cfg from './config';
import { BrowserWebSocket, WebSocketStream } from './web-socket-stream';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { timeoutPromise } from './utils/utils';
import DesktopConnection from './desktop-connection';
import { TestConnectionResult } from './types/desktop';

const TIMEOUT_CONNECT = 20000;

class DesktopManager {
  private background?: EventEmitter;

  private desktopConnection?: DesktopConnection;

  private connected: boolean;

  constructor() {
    this.connected = false;
  }

  public async init(state: any, background: EventEmitter) {
    this.background = background;

    this.background.on('memory-state-update', (flatState: any) =>
      this.onMemoryStateUpdate(flatState),
    );

    background.on('generate-otp', (callback) => {
      const otp = generate();
      return callback(otp);
    });

    log.debug('Init State', state);

    if (state?.DesktopController?.desktopEnabled === true) {
      this.connected = true;
      this.desktopConnection = await this.createConnection();

      await this.desktopConnection.transferState();
    }

    log.debug('Initialised desktop manager');
  }

  public getConnection(): DesktopConnection | undefined {
    return this.desktopConnection;
  }

  public async testConnection(): Promise<TestConnectionResult> {
    const connection = await this.createConnection();
    const isValidVersion = await this.verifyVersion(connection);
    connection.disconnect();

    return { success: isValidVersion };
  }

  private async onMemoryStateUpdate(flatState: any) {
    const isPairing = flatState.isPairing as boolean;

    if (!this.connected && isPairing === true) {
      log.debug('Desktop is pairing');

      this.connected = true;
      this.desktopConnection = await this.createConnection();

      if (cfg().desktop.skipOtpPairingFlow) {
        log.debug('Desktop enabled');
        await this.desktopConnection.transferState();
      }
    }
  }

  private onDisconnect(
    webSocket: BrowserWebSocket,
    stream: Duplex,
    connection: DesktopConnection,
  ) {
    log.debug('Web socket disconnected');

    stream.removeAllListeners();
    stream.destroy();

    webSocket.close();

    connection.removeAllListeners();

    if (connection === this.desktopConnection) {
      this.desktopConnection = undefined;
      this.connected = false;
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

    connection.on('disconnect', () =>
      this.onDisconnect(webSocket, webSocketStream, connection),
    );

    log.debug('Created web socket connection');

    return connection;
  }

  private async verifyVersion(connection: DesktopConnection): Promise<boolean> {
    const desktopVersion = await connection.getDesktopVersion();
    const minimumDesktopVersion = 0;

    if (desktopVersion < minimumDesktopVersion) {
      log.error('Desktop version check failed', {
        desktopVersion,
        minimumDesktopVersion,
      });

      return false;
    }

    return true;
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
