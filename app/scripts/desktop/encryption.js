import { encrypt as _encrypt, decrypt as _decrypt, PrivateKey } from 'eciesjs';

export const createKeyPair = () => {
    const privateKey = new PrivateKey();
    const { publicKey } = privateKey;

    return {
        privateKey: privateKey.toHex(),
        publicKey: publicKey.toHex()
    };
};

export const encrypt = (data, publicKey) => {
    return _encrypt(publicKey, Buffer.from(data, 'utf8')).toString('hex');
};

export const decrypt = (data, privateKey) => {
    return _decrypt(privateKey, Buffer.from(data, 'hex')).toString('utf8');
};
