/**
 * Port of api-enhanced/util/request.js — the single outbound HTTP layer.
 *
 * Preserved behaviors (see PRD FR-NCM-04):
 * - 5 crypto branches (weapi/eapi/linuxapi/xeapi/api) via @music-api/ncm-crypto
 * - cookie auto-completion (__remember_me/_ntes_nuid/WNMCID/NMTID/anonymous MUSIC_A)
 * - UA selection per crypto+os (config.USER_AGENT_MAP)
 * - checkToken v2/v3 -> X-antiCheatToken (via injected getCheckToken)
 * - eapi/weapi responses: arraybuffer + decrypt; SPECIAL_STATUS_CODES -> 200
 * - body.code forced to Number; non-200 rejects; network errors -> 502 reject
 * - NMTID probing (eapi only, 3 retries, from Set-Cookie)
 * - xeapi session capture (x-encr-ssid/x-encr-sskey response headers)
 *
 * Deviations from the original:
 * - axios -> global fetch (Node 22). keep-alive agents dropped; fetch manages
 *   its own connections. `settings.encoding = null` (not an axios option)
 *   ignored; arraybuffer handling is explicit and unambiguous.
 * - Proxy: http(s) tunnel via undici ProxyAgent as dispatcher (dynamic import;
 *   throws a descriptive error when undici is unavailable instead of silently
 *   going direct). PAC scripts: warned + direct (no pac-proxy-agent equivalent).
 * - Load-time fs reads and require() of register_checktoken_* modules removed;
 *   see tokenStore.ts (lazy + injectable).
 * - `CryptoJS.lib.WordArray.random(n)` -> crypto.randomBytes(n) (same bytes).
 * - eapiResDecrypt's aeapi flag is `!!headers['x-aeapi']` (original passed the
 *   raw header value; truthiness identical).
 */
import { randomBytes } from "node:crypto";
import {
	eapi,
	eapiResDecrypt,
	linuxapi,
	weapi,
	xeapi,
	xeapiResDecrypt,
} from "@music-api/ncm-crypto";
import {
	API_DOMAIN,
	chooseUserAgent,
	DOMAIN,
	EAPI_DOMAIN,
	ENCRYPT_DEFAULT,
	ENCRYPT_RESPONSE_DEFAULT,
	OS_MAP,
	OSX_DESKTOP_UA,
	SPECIAL_STATUS_CODES,
	XEAPI_DOMAIN,
} from "./config.js";
import { getDeviceId } from "./globalState.js";
import {
	getAnonymousToken,
	getCheckToken,
	loadXeapiPublicKey,
} from "./tokenStore.js";
import { cookieObjToString, cookieToJson, toBoolean } from "./utils.js";

export interface NcmRequestOptions {
	crypto?: string;
	cookie?: Record<string, unknown> | string;
	ua?: string;
	proxy?: string;
	realIP?: string;
	ip?: string;
	randomCNIP?: boolean;
	e_r?: unknown;
	domain?: string;
	checkToken?: string | boolean;
	headers?: Record<string, string>;
	timeout?: number;
	/** Test seam / runtime override. Defaults to global fetch. */
	fetchImpl?: typeof fetch;
	/** Per-call checktoken provider (overrides the initNcmCore one). */
	getCheckToken?: (version: "v2" | "v3") => Promise<string>;
}

export interface NcmResponse {
	status: number;
	// biome-ignore lint/suspicious/noExplicitAny: upstream bodies are untyped
	body: any;
	cookie: string[];
}

// ---- module-level runtime state (mirrors original module-level lets) ----

const WNMCID = (() => {
	const chars = "abcdefghijklmnopqrstuvwxyz";
	let s = "";
	for (let i = 0; i < 6; i++) {
		s += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return `${s}.${Date.now().toString()}.01.0`;
})();

let nmtid = "";
let nmtidRetriesLeft = 3;
let xeapiSessionId = "";
let xeapiSessionKey = "";

/** Reset request-level caches (tests only). */
export const resetRequestState = (): void => {
	nmtid = "";
	nmtidRetriesLeft = 3;
	xeapiSessionId = "";
	xeapiSessionKey = "";
};

const generateRequestId = (): string =>
	`${Date.now()}_${Math.floor(Math.random() * 1000)
		.toString()
		.padStart(4, "0")}`;

const processCookieObject = (
	cookie: Record<string, unknown>,
	crypto: string,
): Record<string, unknown> => {
	const nuid = randomBytes(32).toString("hex");
	const profile = OS_MAP[cookie.os as string] || OS_MAP.pc;
	const processed: Record<string, unknown> = {
		...cookie,
		__remember_me: "true",
		ntes_kaola_ad: "1",
		_ntes_nuid: cookie._ntes_nuid || nuid,
		_ntes_nnid: cookie._ntes_nnid || `${nuid},${Date.now().toString()}`,
		WNMCID: cookie.WNMCID || WNMCID,
		WEVNSM: cookie.WEVNSM || "1.0.0",
		osver: cookie.osver || profile.osver,
		deviceId: cookie.deviceId || getDeviceId(),
		os: cookie.os || profile.os,
		channel: cookie.channel || profile.channel,
		appver: cookie.appver || profile.appver,
	};

	if (cookie.NMTID) {
		processed.NMTID = cookie.NMTID;
	} else if (nmtid) {
		processed.NMTID = nmtid;
	} else if (nmtidRetriesLeft <= 0 || crypto !== "eapi") {
		processed.NMTID = `00O${randomBytes(19).toString("hex")}`;
	}

	if (!processed.MUSIC_U) {
		processed.MUSIC_A = processed.MUSIC_A || getAnonymousToken();
	}
	return processed;
};

const createHeaderCookie = (header: Record<string, unknown>): string => {
	const keys = Object.keys(header);
	const parts = new Array(keys.length);
	for (let i = 0, len = keys.length; i < len; i++) {
		const key = keys[i];
		parts[i] =
			`${encodeURIComponent(key)}=${encodeURIComponent(String(header[key]))}`;
	}
	return parts.join("; ");
};

/** Build a fetch dispatcher for query.proxy (undici ProxyAgent). */
const buildDispatcher = async (proxy: string): Promise<unknown> => {
	if (proxy.includes("pac")) {
		console.warn(
			"[ncm-core] PAC proxy scripts are not supported in this port (no pac-proxy-agent equivalent); the request will go DIRECT. Deviation from the original.",
		);
		return undefined;
	}
	try {
		const { ProxyAgent } = await import("undici");
		return new ProxyAgent(proxy);
	} catch {
		throw new Error(
			`[ncm-core] proxy "${proxy}" requested but the 'undici' package is not installed; refusing to send the request without the configured proxy`,
		);
	}
};

export const createRequest = async (
	uri: string,
	// biome-ignore lint/suspicious/noExplicitAny: module data bags are untyped
	data: Record<string, any>,
	options: NcmRequestOptions = {},
): Promise<NcmResponse> => {
	// Anti-cheat token (original: required ../module/register_checktoken_v2/v3)
	let token = "";
	const tokenProvider = options.getCheckToken ?? getCheckToken;
	switch (options.checkToken) {
		case "v2":
			token = await tokenProvider("v2");
			break;
		case "v3":
			token = await tokenProvider("v3");
			break;
	}

	const headers: Record<string, string> = options.headers
		? { ...options.headers }
		: {};
	const ip = options.realIP || options.ip || "";

	let crypto = options.crypto;
	if (!crypto) {
		crypto = ENCRYPT_DEFAULT ? "eapi" : "api";
	}

	if (ip) {
		headers["X-Real-IP"] = ip;
		headers["X-Forwarded-For"] = ip;
	}

	let cookie: Record<string, unknown> = {};
	const rawCookie = options.cookie || {};
	if (typeof rawCookie === "string") {
		cookie = cookieToJson(rawCookie);
	} else if (typeof rawCookie === "object") {
		cookie = rawCookie as Record<string, unknown>;
	}
	cookie = processCookieObject(cookie, crypto);
	headers.Cookie = cookieObjToString(cookie);

	let url = "";
	let encryptData: Record<string, unknown> = {};
	const csrfToken = (cookie.__csrf as string) || "";

	const answer: NcmResponse = { status: 500, body: {}, cookie: [] };

	data.e_r = toBoolean(
		options.e_r !== undefined
			? options.e_r
			: data.e_r !== undefined
				? data.e_r
				: ENCRYPT_RESPONSE_DEFAULT,
	);

	switch (crypto) {
		case "weapi":
			headers.Referer = options.domain || DOMAIN;
			headers["User-Agent"] = options.ua || chooseUserAgent("weapi");
			data.csrf_token = csrfToken;
			if (options.checkToken) {
				headers["X-antiCheatToken"] = token;
			}
			encryptData = weapi(data);
			url = `${options.domain || DOMAIN}/weapi/${uri.substr(5)}`;
			break;

		case "linuxapi":
			headers["User-Agent"] =
				options.ua || chooseUserAgent("linuxapi", "linux");
			encryptData = linuxapi({
				method: "POST",
				url: (options.domain || DOMAIN) + uri,
				params: data,
			});
			url = `${options.domain || DOMAIN}/api/linux/forward`;
			break;

		case "xeapi": {
			const xeapiPublicKey = loadXeapiPublicKey();
			if (!xeapiPublicKey) {
				throw new Error("xeapi public key is missing");
			}
			const xeapiOs = cookie.os === "android" ? "android" : "android";
			const xeapiAppver =
				cookie.os === "android" && cookie.appver ? cookie.appver : "9.1.65";
			const xeapiOsver =
				cookie.os === "android" && cookie.osver ? cookie.osver : "16";
			const xeapiBuildver =
				(cookie.buildver as string) || Date.now().toString().substr(0, 10);
			headers["User-Agent"] = options.ua || chooseUserAgent("api", "android");
			headers["X-Client-Enc-State"] = "ENCRYPTED";
			headers["x-aeapi"] = "true";
			headers["content-type"] =
				"application/x-www-form-urlencoded;charset=utf-8";
			headers["x-deviceid"] = String(cookie.deviceId);
			headers["x-os"] = xeapiOs;
			headers["x-osver"] = String(xeapiOsver);
			headers["x-appver"] = String(xeapiAppver);
			headers["x-sdeviceid"] = String(cookie.sDeviceId || cookie.deviceId);
			headers["x-buildver"] = xeapiBuildver;
			if (cookie.MUSIC_U) headers["x-music-u"] = String(cookie.MUSIC_U);
			if (options.checkToken) {
				headers["X-antiCheatToken"] = token;
			}
			const xeapiCookie = {
				...cookie,
				os: xeapiOs,
				osver: xeapiOsver,
				appver: xeapiAppver,
				buildver: xeapiBuildver,
				deviceId: cookie.deviceId,
				sDeviceId: cookie.sDeviceId || cookie.deviceId,
			};
			headers.Cookie = cookieObjToString(xeapiCookie);
			url = `${options.domain || XEAPI_DOMAIN}/xeapi/${uri.substr(5)}`;
			encryptData = xeapi(uri, data, {
				publicKeyState: xeapiPublicKey,
				sessionId: xeapiSessionId,
				sessionKey: xeapiSessionKey,
				os: xeapiOs,
			});
			break;
		}

		case "eapi":
		case "api": {
			const header: Record<string, unknown> = {
				osver: cookie.osver,
				deviceId: cookie.deviceId,
				os: cookie.os,
				appver: cookie.appver,
				versioncode: cookie.versioncode || "140",
				mobilename: cookie.mobilename || "",
				buildver: cookie.buildver || Date.now().toString().substr(0, 10),
				resolution: cookie.resolution || "1920x1080",
				__csrf: csrfToken,
				channel: cookie.channel,
				requestId: generateRequestId(),
			};
			if (cookie.MUSIC_U) header.MUSIC_U = cookie.MUSIC_U;
			if (cookie.MUSIC_A) header.MUSIC_A = cookie.MUSIC_A;
			if (options.checkToken) header["X-antiCheatToken"] = token;
			if (crypto === "eapi" && cookie.NMTID) header.NMTID = cookie.NMTID;

			headers.Cookie = createHeaderCookie(header);
			headers["User-Agent"] =
				options.ua ||
				(cookie.os === "osx"
					? OSX_DESKTOP_UA
					: chooseUserAgent("api", "iphone"));

			if (crypto === "eapi") {
				data.header = header;
				encryptData = eapi(uri, data);
				url = `${options.domain || EAPI_DOMAIN}/eapi/${uri.substr(5)}`;
			} else {
				url = (options.domain || API_DOMAIN) + uri;
				encryptData = data;
			}
			break;
		}

		default:
			console.log("[ERR]", "Unknown Crypto:", crypto);
			break;
	}

	// fetch settings
	// parity: axios 发送 string body 时不带 Content-Type(上游按表单解析);
	// undici fetch 会默认补 text/plain;charset=UTF-8,导致上游返回空 body。
	// 显式声明表单类型,上游实测返回正常数据。xeapi 分支自带 content-type,不覆盖。
	if (!Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
		headers["Content-Type"] = "application/x-www-form-urlencoded";
	}
	const fetchInit: RequestInit & { dispatcher?: unknown } = {
		method: "POST",
		headers,
		body: new URLSearchParams(encryptData as Record<string, string>).toString(),
	};
	if ((options.timeout ?? 0) > 0) {
		fetchInit.signal = AbortSignal.timeout(options.timeout as number);
	}
	if (options.proxy) {
		fetchInit.dispatcher = await buildDispatcher(options.proxy);
	}

	const fetchImpl = options.fetchImpl ?? fetch;
	const useER = (crypto === "eapi" || crypto === "weapi") && data.e_r;
	const useXeapi = crypto === "xeapi";

	try {
		const res = await fetchImpl(url, fetchInit);
		const rawSetCookies =
			typeof res.headers.getSetCookie === "function"
				? res.headers.getSetCookie()
				: [];
		const cleanCookie = (x: string) => x.replace(/\s*Domain=[^(;|$)]+;*/, "");

		// NMTID probing: only for real eapi requests that carried no NMTID
		if (crypto === "eapi" && !nmtid && nmtidRetriesLeft > 0 && !cookie.NMTID) {
			nmtidRetriesLeft--;
			answer.cookie = rawSetCookies.map((x) => {
				const cleaned = cleanCookie(x);
				const match = x.match(/(?:^|;\s*)NMTID=([^;]+)/);
				if (match) {
					nmtid = match[1];
				}
				return cleaned;
			});
		} else {
			answer.cookie = rawSetCookies.map(cleanCookie);
		}

		let rawBody: unknown = "";
		try {
			if (useXeapi) {
				const ssid = res.headers.get("x-encr-ssid");
				const sskey = res.headers.get("x-encr-sskey");
				if (ssid && sskey) {
					xeapiSessionId = ssid;
					xeapiSessionKey = sskey;
				}
				rawBody = Buffer.from(await res.arrayBuffer());
				answer.body = xeapiResDecrypt(rawBody as Buffer);
			} else if (useER) {
				rawBody = Buffer.from(await res.arrayBuffer());
				answer.body = eapiResDecrypt(
					(rawBody as Buffer).toString("hex").toUpperCase(),
					!!headers["x-aeapi"],
				);
			} else {
				const text = await res.text();
				rawBody = text;
				try {
					answer.body = JSON.parse(text);
				} catch {
					answer.body = text;
				}
			}

			const b = answer.body as { code?: unknown };
			if (b.code) {
				b.code = Number(b.code);
			}
			answer.status = Number(b.code || res.status);
			if (SPECIAL_STATUS_CODES.has(b.code as number)) {
				answer.status = 200;
			}
		} catch {
			answer.body = rawBody;
			answer.status = res.status;
		}
	} catch (err) {
		// Network-level failure (fetch threw) -> 502, like the original.
		answer.status = 502;
		answer.body = {
			code: 502,
			msg: (err as Error)?.message || err,
		};
		console.log("[ERR]", answer);
		throw answer;
	}

	answer.status =
		answer.status > 100 && answer.status < 600 ? answer.status : 400;

	if (answer.status === 200) {
		return answer;
	}
	console.log("[ERR]", answer);
	throw answer;
};
