import { decodeTorrentFile, TorrentFile } from "./parser/torrent-file";
import fs from "node:fs";

const downloadTorrentFile = async (torrentPath: string) => {
	const torrentBuffer = fs.readFileSync(torrentPath);
	const torrent = new TorrentFile(
		torrentBuffer,
		await decodeTorrentFile(torrentBuffer),
	);

	console.log(
		`All announce URLs: \n${torrent.announceList.map((v) => `- ${v}`).join("\n")}`,
	);

	const peerList = await torrent.peerList;
	console.log("Peer list:");
	console.table(peerList);
};

downloadTorrentFile("./test.torrent");
