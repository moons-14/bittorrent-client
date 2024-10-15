export interface Config {
	defaultTrackers: string[];
	allowedTrackerProtocols: ("udp:" | "http:" | "https:")[];
	port: number;
}
