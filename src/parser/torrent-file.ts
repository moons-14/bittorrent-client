
import parseTorrent, { toTorrentFile } from 'parse-torrent';
import * as ParseTorrentFile from "parse-torrent-file";
import crypto from 'crypto';


export class TorrentFile {

    constructor(
        public _benecode: Buffer,
        public torrent: ParseTorrentFile.Instance
    ) { }

    get size() {
        if (this.torrent.info && this.torrent.info.files) {
            return this.torrent.info.files.map(file => file.size).reduce((a, b) => a + b);
        } else {
            return 0;
        }
    }

    get infoHash() {
        const info = toTorrentFile({
            info: this.torrent.info
        });
        return crypto.createHash('sha1').update(info).digest();
    }

}

export const decodeTorrentFile = async (torrent: Buffer) => {
    return await parseTorrent(torrent) as ParseTorrentFile.Instance;
}