import { getProtocolFromUrl } from "utils/getProtocolFromUrl";
import { httpTracker } from "./http-tracker";
import { udpTracker } from "./udp-tracker";
import config from "../../config";
import type { TorrentFile } from "parser/torrent-file";
import type { AnnounceResponse } from "types/tracker";
import consola from "consola";

export const getUseTrackerList = (trackers: string[]) => {
	const allTrackers = trackers.concat(config.defaultTrackers);

	const useTrackers: string[] = [];
	for (const tracker of allTrackers) {
		try {
			const protocol = getProtocolFromUrl(tracker);

			if (config.allowedTrackerProtocols.includes(protocol)) {
				useTrackers.push(tracker);
			}
		} catch (e) { }
	}

	return useTrackers;
};


const getPeers = async (announce: string, torrent: TorrentFile) => {
	try {
		const protocol = getProtocolFromUrl(announce);

		if (protocol === "http:") {
			const tracker = new httpTracker(announce, torrent);
			await tracker.getPeers();
			return tracker.announceResponse;
		}
		if (protocol === "udp:") {
			const tracker = new udpTracker(announce, torrent);
			await tracker.getPeers();
			return tracker.announceResponse;
		}
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (e: any) {
		consola.error(`Error connecting to tracker: ${announce}`, e.message);
		// consola.error(e);
		return null;
	}
};

export const getPeerList = async (trackers: string[], torrent: TorrentFile) => {

	const peerList = (
		await Promise.all(trackers.map((tracker) => getPeers(tracker, torrent)))
	).filter((peer) => !!peer) as AnnounceResponse[];
	
	const uniquePeers = peerList
		.reduce(
			(acc, cur) => {
				return acc.concat(cur.peers);
			},
			[] as AnnounceResponse["peers"],
		)
		.filter((peer, index, self) => {
			return (
				index ===
				self.findIndex((p) => p.ip === peer.ip && p.port === peer.port)
			);
		});

	return uniquePeers;
};
