import crypto from 'crypto';

export const genPeerIdBuffer = (): Buffer => {
    let id = crypto.randomBytes(20);
    Buffer.from('-BC0001-').copy(id, 0);
    return id;
}

export const genPeerIdString = (): string => {
    const prefix = '-BC0001-';
    const totalLength = 20;
    const suffixLength = totalLength - prefix.length;

    let suffix = '';
    for (let i = 0; i < suffixLength; i++) {
        const randomDigit = Math.floor(Math.random() * 10);
        suffix += randomDigit.toString();
    }

    return prefix + suffix;
}