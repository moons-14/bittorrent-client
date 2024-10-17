import { genPeerIdString } from "../utils/genPeerId";
import bencode from "bencode";
import type { TorrentFile } from "../parser/torrent-file";
import config from "../../config";
import type { AnnounceResponse, httpTrackerResponse } from "types/tracker";
import { isUint8Array } from "utils/isUint8Array";
import { consola } from "consola";
import { urlEncodeBytes } from "utils/bufferEncode";

export class httpTracker {
	public url: URL;
	public torrent: TorrentFile;
	private peerId: string;

	public announceResponse?: AnnounceResponse;

	constructor(url: string, torrent: TorrentFile) {
		this.url = new URL(url);
		this.torrent = torrent;
		this.peerId = genPeerIdString();
	}

	public async getPeers() {
		const announceUrl = this.buildAnnounceRequestUrl();
		console.log(announceUrl);
		const response = await fetch(announceUrl, {
			signal: AbortSignal.timeout(5000),
		});
		if (!response.ok) {
			throw new Error("Invalid response");
		}
		const responseBuffer = (await response.arrayBuffer()) as Buffer;

		const { complete, incomplete, interval, minInterval, peers } =
			this.parseAnnounceResponse(responseBuffer);

		consola.box(
			`Announce URL: ${announceUrl.toString()}\nLeechers: ${incomplete} | Seeders: ${complete}`,
			peers,
		);

		this.announceResponse = {
			leechers: incomplete,
			seeders: complete,
			peers,
		};
	}

	private buildAnnounceRequestUrl() {
		const announceUrl = this.url;
		announceUrl.searchParams.append("peer_id", this.peerId);
		announceUrl.searchParams.append("port", config.port.toString());
		announceUrl.searchParams.append("uploaded", "0");
		announceUrl.searchParams.append("downloaded", "0");
		announceUrl.searchParams.append("left", "0");
		return `${announceUrl.toString()}&info_hash=${urlEncodeBytes(this.torrent.infoHash)}`;
	}

	private parseAnnounceResponse(response: Buffer) {
		const decodedResponse = bencode.decode(response) as httpTrackerResponse;

		if (
			!(
				"complete" in decodedResponse &&
				"incomplete" in decodedResponse &&
				"interval" in decodedResponse &&
				"min interval" in decodedResponse &&
				"peers" in decodedResponse
			)
		) {
			throw new Error("Invalid response");
		}

		const peers: Array<{ ip: string; port: number; peerId?: string }> = [];
		if (isUint8Array(decodedResponse.peers)) {
			for (let i = 0; i < decodedResponse.peers.length; i += 6) {
				peers.push({
					ip: decodedResponse.peers.slice(i, i + 4).join("."),
					port: decodedResponse.peers
						.slice(i + 4, i + 6)
						.reduce((a, b) => a * 256 + b),
				});
			}
		} else {
			for (let i = 0; i < decodedResponse.peers.length; i++) {
				let ip: string;
				if (isUint8Array(decodedResponse.peers[i].ip)) {
					ip = String.fromCharCode(
						...(decodedResponse.peers[i].ip as Uint8Array),
					);
				} else {
					ip = decodedResponse.peers[i].ip as string;
				}

				let peerId: string;
				if (isUint8Array(decodedResponse.peers[i]["peer id"])) {
					peerId = String.fromCharCode(
						...(decodedResponse.peers[i]["peer id"] as Uint8Array),
					);
				} else {
					peerId = decodedResponse.peers[i]["peer id"] as string;
				}

				peers.push({
					ip,
					port: decodedResponse.peers[i].port,
					peerId,
				});
			}
		}

		return {
			complete: decodedResponse.complete,
			incomplete: decodedResponse.incomplete,
			interval: decodedResponse.interval,
			minInterval: decodedResponse["min interval"],
			peers,
		};
	}
}
