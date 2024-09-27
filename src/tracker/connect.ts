import { getProtocolFromUrl } from "utils/getProtocolFromUrl";
import { httpTracker } from "./http-tracker";
import { udpTracker } from "./udp-tracker";
import config from "../../config";
import { TorrentFile } from "parser/torrent-file";
import { AnnounceResponse } from "types/tracker";

const getPeers = async (announce: string, torrent: TorrentFile) => {
    try {
        // const announce = torrent.torrent.announce[1];
        console.log(`Announce URL: ${announce}`);

        const protocol = getProtocolFromUrl(announce);
        console.log(`Announce URL protocol: ${protocol}`);

        if (!config.allowedTrackerProtocols.includes(protocol)) {
            console.error("Tracker protocol not allowed");
            return;
        }

        if (protocol === "http:") {
            const tracker = new httpTracker(announce, torrent);
            await tracker.getPeers();
            return tracker.announceResponse;
        } else if (protocol === "udp:") {
            const tracker = new udpTracker(announce, torrent);
            await tracker.getPeers();
            return tracker.announceResponse;
        };
    } catch (e) {
        console.error(`Error connecting to tracker: ${announce}`);
        // console.error(e);
        return null;
    }
}

export const getPeerList = async (trackers: string[], torrent: TorrentFile) => {

    const useTrackers = trackers.concat(config.defaultTrackers);

    const peerList = (await Promise.all(useTrackers.map(tracker => getPeers(tracker, torrent)))).filter(peer => peer !== null) as AnnounceResponse[];
    // ipとポートが重複しているpeerを削除
    const uniquePeers = peerList.reduce((acc, cur) => {
        return acc.concat(cur.peers);
    }, [] as AnnounceResponse["peers"]).filter((peer, index, self) => {
        return index === self.findIndex(p => p.ip === peer.ip && p.port === peer.port);
    });

    return uniquePeers;
}