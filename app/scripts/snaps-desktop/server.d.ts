/// <reference types="ws" />
import { Handlers } from './client';
/**
 * Create a new WebSocket server to handle (encrypted) JSON-RPC requests.
 *
 * @param handlers - Handlers to run for specific RPC methods.
 * @returns An instance of the WebSocket server and the underlying client.
 */
export declare const createWebSocketServer: (handlers: Handlers) => {
    server: import("ws").Server<import("ws").WebSocket>;
    getClient: () => {
        performHandshake: () => Promise<void>;
        requestEncrypted: <Params>(req: import("@metamask/utils").JsonRpcRequest<Params>) => Promise<unknown>;
    } | null;
};
