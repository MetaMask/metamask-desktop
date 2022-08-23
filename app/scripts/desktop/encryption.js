import { encrypt as _encrypt, decrypt as _decrypt, PrivateKey } from 'eciesjs';

let _keyCache = {};

export const encrypt = async (data, password) => {
    const keys = await _createKeyPair(password);
    return _encrypt(keys.publicKey.toHex(), Buffer.from(data, 'utf8')).toString('hex');
};

export const decrypt = async (data, password) => {
    const keys = await _createKeyPair(password);
    return _decrypt(keys.privateKey.toHex(), Buffer.from(data, 'hex')).toString('utf8');
};

const _createKeyPair = async (secret) => {
    let keys = _keyCache[secret];

    if(!keys) {
        const hash = await window.crypto.subtle.digest('SHA-256', Buffer.from(secret, 'utf-8'));
        const secretKey = hash.slice(0, 32);
        const privateKey = new PrivateKey(Buffer.from(secretKey));
        const { publicKey } = privateKey;

        keys = { privateKey, publicKey };
        _keyCache[secret] = keys;
    }

    return keys;
};
