import { parseTorrentFileFromPath } from "./parser/torrent-file";
import { httpTracker } from "./tracker/http-tracker";
import { udpTracker } from "./tracker/udp-tracker";
import { getProtocolFromUrl } from "./utils/getProtocolFromUrl";

const downloadTorrentFile = async (torrentPath: string) => {
    const torrentObject = await parseTorrentFileFromPath(torrentPath);
    if (torrentObject.announce && torrentObject.announce.length > 0) {
        // TODO: multi announce support
        const announce = torrentObject.announce[2];
        console.log(`Announce URL: ${announce} \n( All announce URLs: \n${torrentObject.announce.map(v => `- ${v}`).join("\n")}\n)\n`);

        const protocol = getProtocolFromUrl(announce);
        console.log(`Announce URL protocol: ${protocol}`);

        if (protocol === "http:" || protocol === "https:") {
            const tracker = new httpTracker(announce, torrentObject);
            await tracker.getPeers();
        } else if (protocol === "udp:") {
            const tracker = new udpTracker(announce, torrentObject);
            await tracker.getPeers();
        };
    } else {
        console.error("No announce URL found in torrent file");
    }
};

downloadTorrentFile("./test.torrent");