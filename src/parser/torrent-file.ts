import fs from 'fs';
import parseTorrent, { toTorrentFile } from 'parse-torrent';
import * as ParseTorrentFile from "parse-torrent-file";
import crypto from 'crypto';
import bignum from 'bignum';

export const parseTorrentFile = async (buffer: Buffer) => {
    let torrentObject: ParseTorrentFile.Instance;
    try {
        torrentObject = (await parseTorrent(buffer)) as ParseTorrentFile.Instance;
    } catch (error) {
        throw new Error(`Error decoding torrent file: ${error}`);
    }
    return torrentObject;
}

export const parseTorrentFileFromPath = async (path: string) => {
    let buffer: Buffer;
    try {
        buffer = fs.readFileSync(path);
    } catch (error) {
        throw new Error(`Error reading file: ${error}`);
    }
    return await parseTorrentFile(buffer);
}

export const infoHash = (torrent: ParseTorrentFile.Instance) => {
    const info = toTorrentFile({
        info: torrent.info
    });
    return crypto.createHash('sha1').update(info).digest();
}

export const infoHashString = (torrent: ParseTorrentFile.Instance) => {
    const info = toTorrentFile({
        info: torrent.info
    });
    return crypto.createHash('sha1').update(info).digest('hex');
}

export const torrentSize = (torrent: ParseTorrentFile.Instance) => {
    const size = torrent.info && torrent.info.files ?
        // @ts-ignore
        torrent.info.files.map(file => file.length).reduce((a, b) => a + b) : torrent.info.length;

    return bignum.toBuffer(size, { size: 8 });
}