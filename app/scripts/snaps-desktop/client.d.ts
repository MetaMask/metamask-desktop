import { JsonRpcRequest } from '@metamask/utils';
import { WebSocket } from 'ws';
export declare enum JsonRpcMethod {
    Handshake = "server_handshake",
    HandleEncryptedMessage = "server_handleEncryptedMessage"
}
export declare enum EncryptedJsonRpcMethod {
    Ping = "ping"
}
export declare type Handlers = Record<string, Handler>;
export declare type Handler = (request: JsonRpcRequest<unknown>) => Promise<string>;
/**
 * Create a WebSocket client from a WebSocket. This client can both send and receive JSON-RPC
 * requests.
 *
 * @param socket - The socket itself.
 * @param handlers - Handlers to run for specific RPC methods.
 * @returns An instance of the WebSocket client.
 */
export declare const createWebSocketClient: (socket: WebSocket, handlers: Handlers) => {
    performHandshake: () => Promise<void>;
    requestEncrypted: <Params>(req: JsonRpcRequest<Params>) => Promise<unknown>;
};
