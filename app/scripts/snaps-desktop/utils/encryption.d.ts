/**
 * A key pair consisting of a private key (secret key) and public key to use for
 * encryption and decryption.
 *
 * @property publicKey - The uncompressed public key as hexadecimal string.
 * @property privateKey - The private key as hexadecimal string.
 */
export interface KeyPair {
    publicKey: string;
    privateKey: string;
}
/**
 * Generate a random key pair for usage with the ECIES algorithm.
 *
 * @returns A key pair consisting of a private key and a public key, as a
 * hexadecimal string.
 */
export declare const createHandshakeKeyPair: () => KeyPair;
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
export declare const encrypt: (data: string, otherPublicKey: string) => string;
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
export declare const decrypt: (data: string, privateKey: string) => string;
