# Encryption

## Communication

All data transferred between MetaMask Desktop and the MetaMask extension is encrypted, specifically all the background JSON-RPC requests and responses.

This is primarly achieved using AES-GCM with a 256-bit key provided by the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) in the browser, and the [node:crypto](https://nodejs.org/api/crypto.html#cryptowebcrypto) implementation in the Electron application. 

The symmetric keys are initially transferred using ECIES provided by [eciesjs](https://github.com/ecies/js).

All related code resides in the `@metamask/desktop` package so it can be defined only once. The core class performing the encryption is the [Encrypted Web Socket Stream](../packages/common/src/encryption/web-socket-stream.ts).

### Handshake

Whenever the MetaMask extension connects to the WebSocket server within MetaMask Desktop, it first performs a handshake process to initialise the encryption by generating the required keys.

This includes the following steps, each performed by the extension and then the Electron application:

1. Send `HSK`.
3. Send randomly generated ECIES public key.
4. Send randomly generated AES-GCM 256 bit key encrypted with the received ECIES public key.
5. Send `DNE` encrypted with AES key.

Both of the WebSocket streams are corked and paused until the handshake is complete.

Each step is automatically retried after 1 second.

The handshake process times out after 10 seconds.

## Storage

While paired with the MetaMask extension, MetaMask desktop stores all MetaMask state in the filesystem in the application data directory.

All private keys remain encrypted as in the extension, but as a further security measure, the entire file is encrypted again using AES-CBC with a 256-bit key.

The encryption itself is powered by [electron-store](https://github.com/sindresorhus/electron-store#encryptionkey), but the key is stored securely using [safeStoage](https://www.electronjs.org/docs/latest/api/safe-storage) which uses the operating system keychain to prevent unauthorised access.

This code is found in the [Obfuscated Store](../packages/app/src/app/storage/storage.ts) class.
