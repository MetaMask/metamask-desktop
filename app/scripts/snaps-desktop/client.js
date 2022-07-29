"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebSocketClient = exports.EncryptedJsonRpcMethod = exports.JsonRpcMethod = void 0;
/* eslint-disable consistent-return */
const utils_1 = require("@metamask/utils");
const eth_rpc_errors_1 = require("eth-rpc-errors");
const nanoid_1 = __importDefault(require("nanoid"));
const encryption_1 = require("./encryption");
const json_1 = require("./json");
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
    const { privateKey, publicKey } = (0, encryption_1.createHandshakeKeyPair)();
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
            return socket.send(JSON.stringify((0, json_1.getJsonRpcError)(null, eth_rpc_errors_1.ethErrors.rpc.internal().serialize())));
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
    const performHandshake = () => __awaiter(void 0, void 0, void 0, function* () {
        const id = (0, nanoid_1.default)();
        const req = (0, json_1.getJsonRpcRequest)(id, JsonRpcMethod.Handshake, [publicKey]);
        otherPublicKey = (yield request(id, req));
    });
    const requestEncrypted = (req) => __awaiter(void 0, void 0, void 0, function* () {
        if (!otherPublicKey) {
            // TODO: Perform handshake?
            throw new Error('Handshake has not been performed yet.');
        }
        const { id } = req;
        if (id && id in requests) {
            throw new Error('The request ID has been used before. It must be a unique value for each request.');
        }
        const message = (0, encryption_1.encrypt)(JSON.stringify(req), otherPublicKey);
        const json = (0, json_1.getJsonRpcRequest)(id, JsonRpcMethod.HandleEncryptedMessage, [
            message,
        ]);
        if (!id) {
            // Send notifications without waiting
            reply(json);
            return;
        }
        return yield request(id, json);
    });
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
        const encryptedResult = (0, encryption_1.encrypt)(JSON.stringify(result !== null && result !== void 0 ? result : null), otherPublicKey);
        return reply((0, json_1.getJsonRpcResponse)(requestId, encryptedResult));
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
        const [parseError, json] = (0, json_1.safeJSONParse)(message);
        if (parseError || !(0, utils_1.isValidJson)(json)) {
            reply((0, json_1.getJsonRpcError)(null, eth_rpc_errors_1.ethErrors.rpc.invalidInput().serialize()));
            return undefined;
        }
        const validatedJson = json;
        if (!(0, utils_1.isJsonRpcRequest)(validatedJson) && !(0, json_1.isJsonRpcResponse)(json)) {
            reply((0, json_1.getJsonRpcError)((_a = validatedJson.id) !== null && _a !== void 0 ? _a : null, eth_rpc_errors_1.ethErrors.rpc.invalidRequest().serialize()));
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
            return reply((0, json_1.getJsonRpcError)(requestId, eth_rpc_errors_1.ethErrors.rpc.invalidRequest().serialize()));
        }
        if (!Array.isArray(params) || typeof params[0] !== 'string') {
            return reply((0, json_1.getJsonRpcError)(requestId, eth_rpc_errors_1.ethErrors.rpc.invalidParams().serialize()));
        }
        otherPublicKey = params[0];
        return reply((0, json_1.getJsonRpcResponse)(requestId, publicKey));
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
    const handleEncryptedMessage = ({ id: requestId, params, }) => __awaiter(void 0, void 0, void 0, function* () {
        if (!otherPublicKey) {
            return reply((0, json_1.getJsonRpcError)(requestId, eth_rpc_errors_1.ethErrors.rpc.invalidRequest().serialize()));
        }
        if (!Array.isArray(params) || typeof params[0] !== 'string') {
            return reply((0, json_1.getJsonRpcError)(requestId, eth_rpc_errors_1.ethErrors.rpc.invalidParams()));
        }
        const encryptedMessage = params[0];
        const message = (0, encryption_1.decrypt)(encryptedMessage, privateKey);
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
                const result = yield handler(validatedJson);
                if (!validatedJson.id) {
                    return;
                }
                return replyEncrypted(requestId, result);
            }
            catch (err) {
                const serialized = err instanceof eth_rpc_errors_1.EthereumRpcError
                    ? err.serialize()
                    : eth_rpc_errors_1.ethErrors.rpc.internal().serialize();
                return reply((0, json_1.getJsonRpcError)(requestId, serialized));
            }
        }
        return reply((0, json_1.getJsonRpcError)(requestId, eth_rpc_errors_1.ethErrors.rpc.methodNotFound().serialize()));
    });
    socket.addEventListener('message', (event) => {
        const message = getMessage(event.data);
        const verifiedJson = verify(message);
        if (!verifiedJson) {
            return;
        }
        if ((0, json_1.isJsonRpcResponse)(verifiedJson)) {
            const validatedJson = verifiedJson;
            if (!validatedJson.id || !(validatedJson.id in requests)) {
                return;
            }
            const { resolve, reject } = requests[validatedJson.id];
            if ((0, utils_1.isJsonRpcSuccess)(validatedJson)) {
                if (otherPublicKey) {
                    const [error, json] = (0, json_1.safeJSONParse)((0, encryption_1.decrypt)(validatedJson.result, privateKey));
                    if (error) {
                        return reject(eth_rpc_errors_1.ethErrors.rpc.internal().serialize());
                    }
                    return resolve(json);
                }
                return resolve(validatedJson.result);
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
        return reply((0, json_1.getJsonRpcError)(id, eth_rpc_errors_1.ethErrors.rpc.methodNotFound().serialize()));
    });
    return { performHandshake, requestEncrypted };
};
exports.createWebSocketClient = createWebSocketClient;
//# sourceMappingURL=client.js.map