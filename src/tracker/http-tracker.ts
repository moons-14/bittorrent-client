import ParseTorrentFile from "parse-torrent-file";
import crypto from 'crypto';
import { genPeerIdString } from "../utils/genPeerId";
import { toTorrentFile } from "parse-torrent"; // Assuming you have this function

export class httpTracker {
    public url: URL;
    public peers: Array<{ ip: string, port: number }> = [];
    public torrent: ParseTorrentFile.Instance;
    private peerId: string;

    constructor(url: string, torrent: ParseTorrentFile.Instance) {
        this.url = new URL(url);
        this.torrent = torrent;
        this.peerId = genPeerIdString();
    }

    public async getPeers() {
        const announceUrl = this.buildAnnounceRequestUrl();
        console.log(`Announce URL: ${announceUrl.toString()}`);
        const response = await fetch(announceUrl.toString());
        const text = await response.text();
        console.log(text);
    }

    private buildAnnounceRequestUrl(port: number = 6881) {
        const announceUrl = new URL(this.url.toString()); // Clone the URL
        const infoHash = infoHashString(this.torrent); // Returns Buffer
        const infoHashParam = bufferToUrlEncodedString(infoHash);
        announceUrl.searchParams.append("info_hash", infoHashParam);
        announceUrl.searchParams.append("peer_id", this.peerId);
        announceUrl.searchParams.append("port", port.toString());
        announceUrl.searchParams.append("uploaded", "0");
        announceUrl.searchParams.append("downloaded", "0");
        announceUrl.searchParams.append("left", "0");
        return announceUrl;
    }
}

export const infoHashString = (torrent: ParseTorrentFile.Instance) => {
    const info = toTorrentFile({
        info: torrent.info
    });
    return crypto.createHash('sha1').update(info).digest(); // Returns Buffer
}

function bufferToUrlEncodedString(buffer: Buffer) {
    let result = '';
    for (const byte of buffer) {
        let hex = byte.toString(16);
        if (hex.length === 1) hex = '0' + hex;
        result += '%' + hex.toUpperCase();
    }
    return result;
}
