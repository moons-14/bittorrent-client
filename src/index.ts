import { decodeTorrentFile, TorrentFile } from "./parser/torrent-file";
import fs from "fs";
import { getPeerList } from "tracker/connect";

const downloadTorrentFile = async (torrentPath: string) => {
    const torrentBuffer = fs.readFileSync(torrentPath);
    const torrent = new TorrentFile(
        torrentBuffer,
        await decodeTorrentFile(torrentBuffer)
    );

    if (torrent.torrent.announce && torrent.torrent.announce.length > 0) {
        console.log(` All announce URLs: \n${torrent.torrent.announce.map(v => `- ${v}`).join("\n")}`);

        const peerList = await getPeerList(torrent.torrent.announce, torrent);
        console.log("Peer list:");
        console.table(peerList);

    } else {
        console.error("No announce URL found in torrent file");
    }
};

downloadTorrentFile("./test.torrent");