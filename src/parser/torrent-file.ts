import parseTorrent, { toTorrentFile } from "parse-torrent";
import type * as ParseTorrentFile from "parse-torrent-file";
import crypto from "node:crypto";
import { getPeerList, getUseTrackerList } from "tracker/connect";

export class TorrentFile {
	constructor(
		public _benecode: Buffer,
		public torrent: ParseTorrentFile.Instance,
	) {}

	get size() {
		if (this.torrent.info?.files) {
			return this.torrent.info.files
				.map((file) => file.size)
				.reduce((a, b) => a + b);
		}
		return 0;
	}

	get infoHash() {
		const info = toTorrentFile({
			info: this.torrent.info,
		});
		return crypto.createHash("sha1").update(info).digest();
	}

	get announceList() {
		if (this.torrent.announce && this.torrent.announce.length > 0) {
			return getUseTrackerList(this.torrent.announce);
		}
		return [];
	}

	get peerList() {
		return getPeerList(this.announceList, this);
	}
}

export const decodeTorrentFile = async (torrent: Buffer) => {
	return (await parseTorrent(torrent)) as ParseTorrentFile.Instance;
};
