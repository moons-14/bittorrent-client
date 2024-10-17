import dgram from "node:dgram";
import crypto from "node:crypto";
import { genPeerIdBuffer } from "../utils/genPeerId";
import type { TorrentFile } from "../parser/torrent-file";
import bignum from "bignum";
import config from "../../config";
import type { AnnounceResponse } from "types/tracker";
import consola from "consola";

export class udpTracker {
	public url: URL;
	public torrent: TorrentFile;
	private socket: dgram.Socket;
	private peerId: Buffer;

	public announceResponse?: AnnounceResponse;

	constructor(url: string, torrent: TorrentFile) {
		this.url = new URL(url);
		this.torrent = torrent;
		this.socket = dgram.createSocket("udp4");
		this.peerId = genPeerIdBuffer();
	}

	public getPeers() {
		return new Promise<void>((resolve, reject) => {
			this.sendConnectRequest(this.buildConnectRequest());

			// Set a timeout for the response
			setTimeout(() => {
				reject(new Error("Timeout"));
			}, 5000);

			this.socket.on("message", (msg) => {
				if (this.responseType(msg) === "connect") {
					const { action, transactionId, connectionId } =
						this.parseConnectResponse(msg);
					console.log(`Connection ID: ${connectionId.toString("hex")}`);

					const announceRequest = this.buildAnnounceRequest(connectionId);
					this.sendConnectRequest(announceRequest);
				} else if (this.responseType(msg) === "announce") {
					// Parse the announce response
					const { action, transactionId, leechers, seeders, peers } =
						this.parseAnnounceResponse(msg);

					console.log(
						`Announce URL: ${this.url}\nLeechers: ${leechers} | Seeders: ${seeders}`,
					);
					console.dir(peers, { depth: null });

					this.announceResponse = {
						leechers,
						seeders,
						peers,
					};

					// Close the socket
					this.socket.close();
					resolve();
				} else {
					console.log("Unknown response type");
				}
			});
		});
	}

	private sendConnectRequest(message: Buffer, callback: () => void = () => {}) {
		this.socket.send(
			message,
			Number(this.url.port),
			this.url.hostname,
			callback,
		);
	}

	private buildConnectRequest() {
		const buffer = Buffer.alloc(16);
		buffer.writeUInt32BE(0x417, 0);
		buffer.writeUInt32BE(0x27101980, 4);
		buffer.writeUInt32BE(0, 8);
		crypto.randomBytes(4).copy(buffer, 12);
		return buffer;
	}

	private parseConnectResponse(response: Buffer) {
		return {
			action: response.readUInt32BE(0),
			transactionId: response.readUInt32BE(4),
			connectionId: response.slice(8),
		};
	}

	private buildAnnounceRequest(connectionId: Buffer) {
		const buffer = Buffer.allocUnsafe(98);
		console.log(this.torrent.infoHash.toString("hex"));

		// connection id
		connectionId.copy(buffer, 0);
		// action
		buffer.writeUInt32BE(1, 8);
		// transaction id
		crypto.randomBytes(4).copy(buffer, 12);
		// info hash
		this.torrent.infoHash.copy(buffer, 16);
		// peerId
		this.peerId.copy(buffer, 36);
		// downloaded
		Buffer.alloc(8).copy(buffer, 56);
		// left
		bignum
			.toBuffer(this.torrent.size, { size: 8, endian: "big" })
			.copy(buffer, 64);
		// uploaded
		Buffer.alloc(8).copy(buffer, 72);
		// event
		buffer.writeUInt32BE(0, 80);
		// ip address
		buffer.writeUInt32BE(0, 84);
		// key
		crypto.randomBytes(4).copy(buffer, 88);
		// num want
		buffer.writeInt32BE(-1, 92);
		// port
		buffer.writeUInt16BE(config.port, 96);

		return buffer;
	}

	private parseAnnounceResponse(response: Buffer) {
		function group(iterable: Buffer, groupSize: number): Buffer[] {
			const groups: Buffer[] = [];
			for (let i = 0; i < iterable.length; i += groupSize) {
				groups.push(iterable.slice(i, i + groupSize));
			}
			return groups;
		}

		return {
			action: response.readUInt32BE(0),
			transactionId: response.readUInt32BE(4),
			leechers: response.readUInt32BE(8),
			seeders: response.readUInt32BE(12),
			peers: group(response.slice(20), 6).map((address: Buffer) => {
				return {
					ip: address.slice(0, 4).join("."),
					port: address.readUInt16BE(4),
				};
			}),
		};
	}

	private responseType(response: Buffer) {
		const action = response.readUInt32BE(0);
		if (action === 0) {
			return "connect";
		}
		if (action === 1) {
			return "announce";
		}
		// throw new Error(`Unknown action ${action}`);
		return "unknown";
	}
}
