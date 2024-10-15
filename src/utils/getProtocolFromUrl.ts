import { URL } from "node:url";

const supportedProtocols = ["http:", "https:", "udp:"] as const;

export const getProtocolFromUrl = (
	url: string,
): (typeof supportedProtocols)[number] => {
	const parsedUrl = new URL(url);
	const _protocol = parsedUrl.protocol;

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	if (supportedProtocols.includes(_protocol as any)) {
		return _protocol as (typeof supportedProtocols)[number];
	}
	throw new Error(`Unsupported protocol: ${_protocol}`);
};
