export type httpTrackerResponse = {
    complete: number;
    downloaded?: number;
    incomplete: number;
    interval: number;
    "min interval": number;
    peers: Array<{ ip: string | Uint8Array, port: number, "peer id": string | Uint8Array }> | Uint8Array;
}

export type AnnounceResponse = {
    leechers: number;
    seeders: number;
    peers: Array<{ ip: string, port: number }>
}