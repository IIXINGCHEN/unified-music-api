/**
 * Port of api-enhanced/util/index.js (cookie helpers, random IP, device id).
 *
 * Deviations from the original:
 * - china_ip_ranges.txt is loaded LAZILY on first generateRandomChineseIP()
 *   call (original read it at module load). Lookup tries ../data and
 *   ../../data relative to this module (src/ vs dist/ layouts).
 * - logger.info calls became console.debug (same messages, lower noise).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const toBoolean = (val: unknown): boolean | "" => {
	if (typeof val === "boolean") return val;
	if (val === "") return val;
	return val === "true" || val === "1" || val === 1;
};

export const cookieToJson = (cookie: string): Record<string, string> => {
	if (!cookie) return {};
	const cookieArr = cookie.split(";");
	const obj: Record<string, string> = {};
	for (let i = 0, len = cookieArr.length; i < len; i++) {
		const item = cookieArr[i];
		const arr = item.split("=");
		if (arr.length === 2) {
			obj[arr[0].trim()] = arr[1].trim();
		}
	}
	return obj;
};

export const cookieObjToString = (cookie: Record<string, unknown>): string => {
	const cookieKeys = Object.keys(cookie);
	const result: string[] = [];
	for (let i = 0, len = cookieKeys.length; i < len; i++) {
		const key = cookieKeys[i];
		result[i] =
			`${encodeURIComponent(key)}=${encodeURIComponent(String(cookie[key]))}`;
	}
	return result.join("; ");
};

export const getRandom = (num: number): number => {
	const randomValue = Math.random();
	const floorValue = Math.floor(randomValue * 9 + 1);
	const powValue = 10 ** (num - 1);
	return Math.floor((randomValue + floorValue) * powValue);
};

// ---- china IP ranges (lazy) ----

interface IpRange {
	start: number;
	end: number;
	count: number;
	cidr: string;
}

const ipToInt = (ip: string): number => {
	const parts = ip.split(".").map(Number);
	const a = (parts[0] << 24) >>> 0;
	const b = parts[1] << 16;
	const c = parts[2] << 8;
	const d = parts[3];
	return a + b + c + d;
};

const intToIp = (int: number): string => {
	return [
		(int >>> 24) & 0xff,
		(int >>> 16) & 0xff,
		(int >>> 8) & 0xff,
		int & 0xff,
	].join(".");
};

const parseCIDR = (cidr: string): IpRange => {
	const [ipStr, prefixLengthStr] = cidr.split("/");
	const prefixLength = Number.parseInt(prefixLengthStr, 10);
	const ipInt = ipToInt(ipStr);
	const mask = (0xffffffff << (32 - prefixLength)) >>> 0;
	const start = (ipInt & mask) >>> 0;
	const end = (start | (~mask >>> 0)) >>> 0;
	return { start, end, count: end - start + 1, cidr };
};

let chinaIPRanges: (IpRange[] & { totalCount: number }) | null = null;

const loadChinaIPRanges = (): IpRange[] & { totalCount: number } => {
	if (chinaIPRanges) return chinaIPRanges;
	try {
		const here = dirname(fileURLToPath(import.meta.url));
		const candidates = [
			join(here, "../data/china_ip_ranges.txt"),
			join(here, "../../data/china_ip_ranges.txt"),
		];
		const filePath = candidates.find((p) => existsSync(p));
		if (!filePath) throw new Error("china_ip_ranges.txt not found");
		const content = readFileSync(filePath, "utf-8");
		const lines = content
			.split("\n")
			.filter((line) => line.trim() && !line.startsWith("#"));
		const arr: IpRange[] = [];
		let total = 0;
		for (const raw of lines) {
			const line = raw.trim();
			if (!line) continue;
			const range = parseCIDR(line);
			arr.push(range);
			total += range.count;
		}
		arr.sort((a, b) => b.count - a.count);
		chinaIPRanges = Object.assign(arr, { totalCount: total });
	} catch (error) {
		console.error(
			"Failed to load china_ip_ranges.txt:",
			(error as Error).message,
		);
		chinaIPRanges = Object.assign([], { totalCount: 0 });
	}
	return chinaIPRanges;
};

const getRandomInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const generateIPSegment = (): number => getRandomInt(1, 255);

export const generateRandomChineseIP = (): string => {
	const ranges = loadChinaIPRanges();
	const total = ranges.totalCount || 0;
	if (!total) {
		const fallback = `116.${getRandomInt(25, 94)}.${generateIPSegment()}.${generateIPSegment()}`;
		console.debug("Generated Random Chinese IP (fallback):", fallback);
		return fallback;
	}
	let offset = Math.floor(Math.random() * total);
	let chosen: IpRange | null = null;
	for (let i = 0; i < ranges.length; i++) {
		const seg = ranges[i];
		if (offset < seg.count) {
			chosen = seg;
			break;
		}
		offset -= seg.count;
	}
	if (!chosen) chosen = ranges[ranges.length - 1];
	const segSize = chosen.end - chosen.start + 1;
	const ipInt = chosen.start + Math.floor(Math.random() * segSize);
	const ip = intToIp(ipInt);
	console.debug("Generated Random Chinese IP:", ip, "from CIDR:", chosen.cidr);
	return ip;
};

export const generateDeviceId = (): string => {
	const hexChars = "0123456789ABCDEF";
	const chars: string[] = [];
	for (let i = 0; i < 52; i++) {
		const randomIndex = Math.floor(Math.random() * hexChars.length);
		chars.push(hexChars[randomIndex]);
	}
	return chars.join("");
};

/** Extract one value from a raw cookie string (no URL decoding). */
export const getCookieValue = (cookieStr: string, name: string): string => {
	if (!cookieStr) return "";
	const cookies = `; ${cookieStr}`;
	const parts = cookies.split(`; ${name}=`);
	if (parts.length === 2) {
		const tail = parts[1];
		return tail.split(";")[0];
	}
	return "";
};

export const generateChainId = (cookie: unknown): string => {
	const version = "v1";
	const randomNum = Math.floor(Math.random() * 1e6);
	const deviceId =
		getCookieValue(cookie as string, "sDeviceId") || `unknown-${randomNum}`;
	const platform = "web";
	const action = "login";
	const timestamp = Date.now();
	return `${version}_${deviceId}_${platform}_${action}_${timestamp}`;
};
