import dgram from 'dgram';
import crypto from 'crypto';
import { genPeerId } from '../utils/genPeerId';
import { infoHash, torrentSize } from '../parser/torrent-file';
import * as ParseTorrentFile from "parse-torrent-file";

export class udpTracker {
    public url: URL;
    public peers: Array<{ ip: string, port: number }> = [];
    public torrent: ParseTorrentFile.Instance;
    private socket: dgram.Socket;
    private peerId: Buffer;

    constructor(url: string, torrent: ParseTorrentFile.Instance) {
        this.url = new URL(url);
        this.torrent = torrent;
        this.socket = dgram.createSocket('udp4');
        this.peerId = genPeerId();
    }

    public getPeers() {
        return new Promise<void>((resolve, reject) => {
            this.sendConnectRequest(this.buildConnectRequest());
            this.socket.on('message', (msg) => {
                if (this.responseType(msg) === "connect") {
                    const { action, transactionId, connectionId } = this.parseConnectResponse(msg);
                    console.log(`Connection ID: ${connectionId.toString('hex')}`);
                    const announceRequest = this.buildAnnounceRequest(connectionId);
                    this.sendConnectRequest(announceRequest);
                } else if (this.responseType(msg) === "announce") {
                    const { action, transactionId, leechers, seeders, peers } = this.parseAnnounceResponse(msg);
                    this.peers = peers;
                    console.table(peers);
                    console.log(`Leechers: ${leechers} | Seeders: ${seeders}`);
                    this.socket.close();
                    resolve();
                }
            });
        });
    }

    private sendConnectRequest(message: Buffer, callback: () => void = () => { }) {
        this.socket.send(message, Number(this.url.port), this.url.hostname, callback)
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
            connectionId: response.slice(8)
        };
    }

    private buildAnnounceRequest(connectionId: Buffer, port: number = 6881) {
        const buffer = Buffer.allocUnsafe(98);

        // connection id
        connectionId.copy(buffer, 0);
        // action
        buffer.writeUInt32BE(1, 8);
        // transaction id
        crypto.randomBytes(4).copy(buffer, 12);
        // info hash
        infoHash(this.torrent).copy(buffer, 16);
        // peerId
        this.peerId.copy(buffer, 36);
        // downloaded
        Buffer.alloc(8).copy(buffer, 56);
        // left
        torrentSize(this.torrent).copy(buffer, 64);
        // uploaded
        Buffer.alloc(8).copy(buffer, 72);
        // event
        buffer.writeUInt32BE(0, 80);
        // ip address
        buffer.writeUInt32BE(0, 80);
        // key
        crypto.randomBytes(4).copy(buffer, 88);
        // num want
        buffer.writeInt32BE(-1, 92);
        // port
        buffer.writeUInt16BE(port, 96);

        return buffer;
    }

    private parseAnnounceResponse(response: Buffer) {
        function group(iterable, groupSize) {
            let groups = [];
            for (let i = 0; i < iterable.length; i += groupSize) {
                //@ts-ignore
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
                    ip: address.slice(0, 4).join('.'),
                    port: address.readUInt16BE(4)
                }
            })
        };
    }


    private responseType(response: Buffer) {
        const action = response.readUInt32BE(0);
        if (action === 0) {
            return "connect";
        } else if (action === 1) {
            return "announce";
        } else {
            throw new Error(`Unknown action ${action}`);
        }
    }
}