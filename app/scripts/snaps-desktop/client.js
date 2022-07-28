"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebSocketClient = exports.EncryptedJsonRpcMethod = exports.JsonRpcMethod = void 0;
/* eslint-disable consistent-return */
const utils_1 = require("@metamask/utils");
const eth_rpc_errors_1 = require("eth-rpc-errors");
const nanoid_1 = __importDefault(require("nanoid"));
const utils_2 = require("./utils");
var JsonRpcMethod;
(function (JsonRpcMethod) {
    JsonRpcMethod["Handshake"] = "server_handshake";
    JsonRpcMethod["HandleEncryptedMessage"] = "server_handleEncryptedMessage";
})(JsonRpcMethod = exports.JsonRpcMethod || (exports.JsonRpcMethod = {}));
var EncryptedJsonRpcMethod;
(function (EncryptedJsonRpcMethod) {
    EncryptedJsonRpcMethod["Ping"] = "ping";
})(EncryptedJsonRpcMethod = exports.EncryptedJsonRpcMethod || (exports.EncryptedJsonRpcMethod = {}));
/**
 * Get a message from raw WebSocket data. The message may sometimes be a buffer,
 * so this function will attempt to parse it to a string.
 *
 * @param message - The raw WebSocket message.
 * @returns The message as a string.
 */
const getMessage = (message) => {
    return message.toString();
};
/**
 * Create a WebSocket client from a WebSocket. This client can both send and receive JSON-RPC
 * requests.
 *
 * @param socket - The socket itself.
 * @param handlers - Handlers to run for specific RPC methods.
 * @returns An instance of the WebSocket client.
 */
const createWebSocketClient = (socket, handlers) => {
    const { privateKey, publicKey } = (0, utils_2.createHandshakeKeyPair)();
    let otherPublicKey = null;
    // Keep track of pending requests
    const requests = {};
    /**
     * Send an arbitrary message to the client. This is expected to be a valid
     * JSON message, and is stringified before sending.
     *
     * @param message - The JSON message to send.
     * @returns Nothing.
     */
    const reply = (message) => {
        if (!(0, utils_1.isValidJson)(message)) {
            return socket.send(JSON.stringify((0, utils_2.getJsonRpcError)(null, eth_rpc_errors_1.ethErrors.rpc.internal().serialize())));
        }
        socket.send(JSON.stringify(message));
    };
    const request = (id, message) => {
        const promise = new Promise((resolve, reject) => {
            requests[id] = { resolve, reject };
        });
        // Send message
        reply(message);
        // Wait for response
        return promise;
    };
    const performHandshake = async () => {
        const id = (0, nanoid_1.default)();
        const req = (0, utils_2.getJsonRpcRequest)(id, JsonRpcMethod.Handshake, [publicKey]);
        otherPublicKey = (await request(id, req));
    };
    const requestEncrypted = async (req) => {
        if (!otherPublicKey) {
            // TODO: Perform handshake?
            throw new Error('Handshake has not been performed yet.');
        }
        const { id } = req;
        if (!id || id in requests) {
            throw new Error('Invalid request ID');
        }
        const message = (0, utils_2.encrypt)(JSON.stringify(req), otherPublicKey);
        const json = (0, utils_2.getJsonRpcRequest)(id, JsonRpcMethod.HandleEncryptedMessage, [
            message,
        ]);
        return await request(id, json);
    };
    /**
     * Send a JSON-RPC response to the client, with an encrypted payload. The
     * result is automatically encrypted with the shared encryption key.
     *
     * @param requestId - The ID of the request to reply to.
     * @param result - The result to send.
     * @returns Nothing.
     */
    const replyEncrypted = (requestId, result) => {
        if (!otherPublicKey) {
            // TODO: Perform handshake?
            throw new Error('Handshake has not been performed yet.');
        }
        // Result cannot be undefined because JSON doesn't support undefined.
        const encryptedResult = (0, utils_2.encrypt)(JSON.stringify(result !== null && result !== void 0 ? result : null), otherPublicKey);
        return reply((0, utils_2.getJsonRpcResponse)(requestId, encryptedResult));
    };
    /**
     * Verify a string as a JSON-RPC request. If the string is not a valid
     * JSON-RPC request, this sends an error to the client, and returns
     * undefined. Otherwise, this returns the parsed request object.
     *
     * @param message - The string to parse.
     * @returns The parsed request object, or undefined if the string is not a
     * valid JSON-RPC request.
     */
    const verify = (message) => {
        var _a;
        const [parseError, json] = (0, utils_2.safeJSONParse)(message);
        if (parseError || !(0, utils_1.isValidJson)(json)) {
            reply((0, utils_2.getJsonRpcError)(null, eth_rpc_errors_1.ethErrors.rpc.invalidInput().serialize()));
            return undefined;
        }
        const validatedJson = json;
        if (!(0, utils_1.isJsonRpcRequest)(validatedJson) && !(0, utils_2.isJsonRpcResponse)(json)) {
            reply((0, utils_2.getJsonRpcError)((_a = validatedJson.id) !== null && _a !== void 0 ? _a : null, eth_rpc_errors_1.ethErrors.rpc.invalidRequest().serialize()));
            return undefined;
        }
        return validatedJson;
    };
    /**
     * Handle a handshake request. This computes the shared encryption key and
     * sends a response to the client, with the server's public key.
     *
     * @param request - The JSON-RPC request.
     * @param request.id - The ID of the request.
     * @param request.params - The parameters of the request.
     * @returns Nothing.
     */
    const handshake = ({ id: requestId, params }) => {
        // Handshake can only be performed once
        if (otherPublicKey) {
            return reply((0, utils_2.getJsonRpcError)(requestId, eth_rpc_errors_1.ethErrors.rpc.invalidRequest().serialize()));
        }
        if (!Array.isArray(params) || typeof params[0] !== 'string') {
            return reply((0, utils_2.getJsonRpcError)(requestId, eth_rpc_errors_1.ethErrors.rpc.invalidParams().serialize()));
        }
        otherPublicKey = params[0];
        return reply((0, utils_2.getJsonRpcResponse)(requestId, publicKey));
    };
    /**
     * Handle an encrypted message. This decrypts the message and replies with
     * a new encrypted message. This can only be called after the handshake
     * has been performed.
     *
     * @param request - The JSON-RPC request.
     * @param request.id - The ID of the request.
     * @param request.params - The parameters of the request.
     * @returns Nothing.
     */
    const handleEncryptedMessage = async ({ id: requestId, params, }) => {
        if (!otherPublicKey) {
            return reply((0, utils_2.getJsonRpcError)(requestId, eth_rpc_errors_1.ethErrors.rpc.invalidRequest().serialize()));
        }
        if (!Array.isArray(params) || typeof params[0] !== 'string') {
            return reply((0, utils_2.getJsonRpcError)(requestId, eth_rpc_errors_1.ethErrors.rpc.invalidParams()));
        }
        const encryptedMessage = params[0];
        const message = (0, utils_2.decrypt)(encryptedMessage, privateKey);
        const validatedJson = verify(message);
        if (!validatedJson) {
            return;
        }
        if (validatedJson.method === EncryptedJsonRpcMethod.Ping) {
            return replyEncrypted(requestId, 'pong');
        }
        const handler = handlers[validatedJson.method];
        if (handler) {
            try {
                const result = await handler(validatedJson);
                return replyEncrypted(requestId, result);
            }
            catch (err) {
                console.error("HANDLER ERR", err);
                const serialized = err instanceof eth_rpc_errors_1.EthereumRpcError
                    ? err.serialize()
                    : eth_rpc_errors_1.ethErrors.rpc.internal().serialize();
                return reply((0, utils_2.getJsonRpcError)(requestId, serialized));
            }
        }
        return reply((0, utils_2.getJsonRpcError)(requestId, eth_rpc_errors_1.ethErrors.rpc.methodNotFound().serialize()));
    };
    socket.addEventListener('message', (event) => {
        const message = getMessage(event.data);
        const verifiedJson = verify(message);
        if (!verifiedJson) {
            return;
        }
        if ((0, utils_2.isJsonRpcResponse)(verifiedJson)) {
            const validatedJson = verifiedJson;
            if (!validatedJson.id || !(validatedJson.id in requests)) {
                return;
            }
            const { resolve, reject } = requests[validatedJson.id];
            if ((0, utils_1.isJsonRpcSuccess)(validatedJson)) {
                const result = otherPublicKey
                    ? JSON.parse((0, utils_2.decrypt)(validatedJson.result, privateKey))
                    : validatedJson.result;
                return resolve(result);
            }
            return reject(validatedJson.error);
        }
        // We know it to be a request then
        // TODO: Handle errors?
        const validatedJson = verifiedJson;
        const { method, id } = validatedJson;
        if (method === JsonRpcMethod.Handshake) {
            return handshake(validatedJson);
        }
        if (method === JsonRpcMethod.HandleEncryptedMessage) {
            return handleEncryptedMessage(validatedJson);
        }
        return reply((0, utils_2.getJsonRpcError)(id, eth_rpc_errors_1.ethErrors.rpc.methodNotFound().serialize()));
    });
    return { performHandshake, requestEncrypted };
};
exports.createWebSocketClient = createWebSocketClient;
//# sourceMappingURL=client.js.map