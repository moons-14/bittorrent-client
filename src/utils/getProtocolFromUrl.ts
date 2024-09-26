import { URL } from 'url';

const supportedProtocols = ["http:", "https:", "udp:"] as const;

export const getProtocolFromUrl = (url: string): typeof supportedProtocols[number] => {
    const parsedUrl = new URL(url);
    const _protocol = parsedUrl.protocol;

    if (supportedProtocols.includes(_protocol as any)) {
        return _protocol as typeof supportedProtocols[number];
    } else {
        throw new Error(`Unsupported protocol: ${_protocol}`);
    }
}