import log from 'loglevel';

const AUTHENTICATION_EXPIRE_AGE = 1000 * 60 * 10; // 10 Minutes

export const flattenMessage = (data) => {
    let output = undefined;
    
    try {
        const stream = data.name;
        const multiplexData = data.data;
        const nestedStream = multiplexData?.name;
        const nestedData = multiplexData?.data;
        const id = nestedData?.id;
        const method = nestedData?.method;
        const result = nestedData?.result;
        
        output = {};
        output = {...output, ...(stream ? { stream } : {})};
        output = {...output, ...(nestedStream ? { type: nestedStream } : {})};
        output = {...output, ...(method ? { method: method } : {})};
        output = {...output, ...(result ? { isResult: true } : {})};
    } catch {
        output = data;
    }
    
    return output;
};

export const verifyDesktopAuthentication = async (password, authentication) => {
    return await _verifyAuthentication(password, authentication, _generateDesktopAuthentication);
};

export const verifyExtensionAuthentication = async (password, authentication) => {
    return await _verifyAuthentication(password, authentication, _generateExtensionAuthentication);
};

export const sendDesktopAuthentication = async (stream, password) => {
    await _sendAuthentication(stream, password, _generateDesktopAuthentication);
};

export const sendExtensionAuthentication = async (stream, password) => {
    await _sendAuthentication(stream, password, _generateExtensionAuthentication);
};

const _sendAuthentication = async (stream, password, generate) => {
    const time = new Date().getTime();
    const value = await generate(password, time);

    log.debug('Sending authentication', { value, time });

    stream.write({
        authentication: {
            value,
            time
        }
    });
};

const _verifyAuthentication = async (password, authentication, generate) => {
    const { value, time } = authentication;
    const currentTime = new Date().getTime();
    const age = currentTime - time;

    if(age > AUTHENTICATION_EXPIRE_AGE) {
        log.debug('Authentication failed as token has expired');
        return false;
    }

    const requiredAuthentication = await generate(password, time);
    
    return requiredAuthentication === value;
};

const _generateDesktopAuthentication = async (password, time) => {
    return await _shaHash(password + password + time);
};

const _generateExtensionAuthentication = async (password, time) => {
    return await _shaHash(password + time);
};

const _shaHash = async (value) => {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', Buffer.from(value, 'utf-8'));
    return Buffer.from(hashBuffer).toString('hex');
};
