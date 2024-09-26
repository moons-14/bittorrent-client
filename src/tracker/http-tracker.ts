import ParseTorrentFile from "parse-torrent-file";
import { genPeerIdString } from "../utils/genPeerId";
import { infoHash } from "../parser/torrent-file";
import bencode from "bencode";
import { hashEncode } from "../utils/hashEncode";

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
        const responseBuffer = await response.arrayBuffer() as Buffer;

        const decodedResponse = bencode.decode(responseBuffer);
        this.peers = decodedResponse.peers;
        console.table(decodedResponse.peers);
    }

    private buildAnnounceRequestUrl(port: number = 6881) {
        let announceUrl = this.url;
        announceUrl.searchParams.append("peer_id", this.peerId);
        announceUrl.searchParams.append("port", port.toString());
        announceUrl.searchParams.append("uploaded", "0");
        announceUrl.searchParams.append("downloaded", "0");
        announceUrl.searchParams.append("left", "0");
        return announceUrl.toString() + "&info_hash=" + hashEncode(infoHash(this.torrent));
    }
}