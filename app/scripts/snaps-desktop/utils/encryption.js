"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = exports.createHandshakeKeyPair = void 0;
const eciesjs_1 = require("eciesjs");
/**
 * Generate a random key pair for usage with the ECIES algorithm.
 *
 * @returns A key pair consisting of a private key and a public key, as a
 * hexadecimal string.
 */
const createHandshakeKeyPair = () => {
    const privateKey = new eciesjs_1.PrivateKey();
    const { publicKey } = privateKey;
    return { privateKey: privateKey.toHex(), publicKey: publicKey.toHex() };
};
exports.createHandshakeKeyPair = createHandshakeKeyPair;
/**
 * Encrypt a message with the receiver's public key. The message is encrypted
 * with the ECIES algorithm.
 *
 * Under the hood, ECIES performs a Diffie-Hellman key exchange and uses the
 * resulting shared secret to encrypt the message.
 *
 * @see https://en.wikipedia.org/wiki/Integrated_Encryption_Scheme
 * @param data - The message to encrypt.
 * @param otherPublicKey - The receiver's public key.
 * @returns The encrypted message as a hexadecimal string.
 */
const encrypt = (data, otherPublicKey) => {
    return (0, eciesjs_1.encrypt)(otherPublicKey, Buffer.from(data, 'utf8')).toString('hex');
};
exports.encrypt = encrypt;
/**
 * Decrypt an encrypted message with a private key. The message is decrypted
 * with the ECIES algorithm.
 *
 * Under the hood, ECIES performs a Diffie-Hellman key exchange and uses the
 * resulting shared secret to decrypt the message.
 *
 * @see https://en.wikipedia.org/wiki/Integrated_Encryption_Scheme
 * @param data - The encrypted message.
 * @param privateKey - The private key to use for decryption.
 * @returns The decrypted message as a string.
 */
const decrypt = (data, privateKey) => {
    return (0, eciesjs_1.decrypt)(privateKey, Buffer.from(data, 'hex')).toString('utf8');
};
exports.decrypt = decrypt;
//# sourceMappingURL=encryption.js.map