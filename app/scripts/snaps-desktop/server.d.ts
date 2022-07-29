/// <reference types="ws" />
import { Handlers } from './client';
interface CreateWebSocketServerOptions {
    host?: string;
    port?: number;
    handlers: Handlers;
}
/**
 * Create a new WebSocket server to handle (encrypted) JSON-RPC requests.
 *
 * @param options - The server options.
 * @param options.host - The host to bind the server to.
 * @param options.port - The port to bind the server to.
 * @param options.handlers - The handlers to run for specific RPC methods.
 * @returns An instance of the WebSocket server and the underlying client.
 */
export declare const createWebSocketServer: ({ host, port, handlers, }: CreateWebSocketServerOptions) => {
    server: import("ws").Server<import("ws").WebSocket>;
    getClient: () => {
        performHandshake: () => Promise<void>;
        requestEncrypted: <Params>(req: import("@metamask/utils").JsonRpcRequest<Params>) => Promise<unknown>;
    } | null;
};
export {};
