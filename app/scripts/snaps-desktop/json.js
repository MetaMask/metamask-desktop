"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJsonRpcResponse = exports.getJsonRpcError = exports.getJsonRpcResponse = exports.getJsonRpcRequest = exports.safeJSONParse = void 0;
/**
 * Attempt to parse a value to a JSON object. If the value cannot be parsed,
 * this returns the parsing error as the first element of the tuple. Otherwise,
 * this returns the parsed object as the second element of the tuple.
 *
 * @param value - The value to parse.
 * @returns A tuple containing the parsing error and the parsed object.
 */
const safeJSONParse = (value) => {
    try {
        return [null, JSON.parse(value)];
    }
    catch (error) {
        return [error, null];
    }
};
exports.safeJSONParse = safeJSONParse;
/**
 * Get a JSON-RPC request object.
 *
 * @param id - The request ID.
 * @param method - The method name.
 * @param params - The method parameters.
 * @returns The JSON-RPC request object.
 */
const getJsonRpcRequest = (id, method, params) => ({
    id,
    jsonrpc: '2.0',
    method,
    params,
});
exports.getJsonRpcRequest = getJsonRpcRequest;
/**
 * Get a JSON-RPC response object.
 *
 * @param id - The ID of the request to reply to.
 * @param result - The JSON-RPC response result.
 * @returns The JSON-RPC response object.
 */
const getJsonRpcResponse = (id, result) => ({
    id,
    jsonrpc: '2.0',
    result,
});
exports.getJsonRpcResponse = getJsonRpcResponse;
/**
 * Get a JSON-RPC response error object.
 *
 * @param id - The ID of the request to reply to.
 * @param error - The JSON-RPC error result.
 * @returns The JSON-RPC response object.
 */
const getJsonRpcError = (id, error) => ({
    id,
    jsonrpc: '2.0',
    error,
});
exports.getJsonRpcError = getJsonRpcError;
const isJsonRpcResponse = (obj) => {
    return (obj !== null &&
        obj !== undefined &&
        typeof obj === 'object' &&
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ('result' in obj || 'error' in obj));
};
exports.isJsonRpcResponse = isJsonRpcResponse;
//# sourceMappingURL=json.js.map