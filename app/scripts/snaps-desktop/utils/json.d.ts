import { JsonRpcId, JsonRpcRequest, JsonRpcResponse } from '@metamask/utils';
import { SerializedEthereumRpcError } from 'eth-rpc-errors/dist/classes';
/**
 * Attempt to parse a value to a JSON object. If the value cannot be parsed,
 * this returns the parsing error as the first element of the tuple. Otherwise,
 * this returns the parsed object as the second element of the tuple.
 *
 * @param value - The value to parse.
 * @returns A tuple containing the parsing error and the parsed object.
 */
export declare const safeJSONParse: <T>(value: string) => [null, T] | [unknown, null];
/**
 * Get a JSON-RPC request object.
 *
 * @param id - The request ID.
 * @param method - The method name.
 * @param params - The method parameters.
 * @returns The JSON-RPC request object.
 */
export declare const getJsonRpcRequest: <Params = unknown>(id: JsonRpcId, method: string, params?: Params | undefined) => JsonRpcRequest<Params>;
/**
 * Get a JSON-RPC response object.
 *
 * @param id - The ID of the request to reply to.
 * @param result - The JSON-RPC response result.
 * @returns The JSON-RPC response object.
 */
export declare const getJsonRpcResponse: <Result>(id: JsonRpcId, result: Result) => JsonRpcResponse<Result>;
/**
 * Get a JSON-RPC response error object.
 *
 * @param id - The ID of the request to reply to.
 * @param error - The JSON-RPC error result.
 * @returns The JSON-RPC response object.
 */
export declare const getJsonRpcError: (id: JsonRpcId, error: SerializedEthereumRpcError) => JsonRpcResponse<SerializedEthereumRpcError>;
export declare const isJsonRpcResponse: (obj: unknown) => boolean;
