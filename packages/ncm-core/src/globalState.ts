/**
 * Process-wide mutable state, replacing the original's `global.cnIp` /
 * `global.deviceId` cross-module globals (api-enhanced app.js set them;
 * server.js read them via request.js).
 *
 * Centralizing here keeps the implicit contract explicit and makes it
 * settable in tests.
 */
import { generateDeviceId, generateRandomChineseIP } from "./utils.js";

let cnIp = "";
let deviceId = "";

export const getCnIp = (): string => {
	if (!cnIp) cnIp = generateRandomChineseIP();
	return cnIp;
};

export const setCnIp = (ip: string): void => {
	cnIp = ip;
};

export const getDeviceId = (): string => {
	if (!deviceId) deviceId = generateDeviceId();
	return deviceId;
};

export const setDeviceId = (id: string): void => {
	deviceId = id;
};

/** Reset all state (tests only). */
export const resetGlobalState = (): void => {
	cnIp = "";
	deviceId = "";
};
