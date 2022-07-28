import { ProtocolRequest, ProtocolResponse } from 'electron';
/**
 * Bootstrap the application.
 */
export declare const bootstrap: () => void;
/**
 * Handles a file protocol request. It checks if the requested file is from the
 * app directory and if so, returns the file. Otherwise, it returns an access
 * denied error.
 *
 * @param request - The protocol request.
 * @param callback - The callback to call with the response.
 * @returns Nothing.
 */
export declare const handleInterceptFileProtocol: (request: ProtocolRequest, callback: (response: ProtocolResponse) => void) => void;
