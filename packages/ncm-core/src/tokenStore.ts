/**
 * Dependency-injected replacements for api-enhanced/util/request.js's
 * load-time side effects:
 *
 *   const anonymous_token = fs.readFileSync(tmpdir/anonymous_token) // CRASH if missing
 *   const { getToken: antiCheatTokenV2 } = require('../module/register_checktoken_v2')
 *
 * Nothing here touches the filesystem or imports checktoken modules at
 * module load. Default loaders read lazily on first use; apps override via
 * initNcmCore() (e.g. the netease app wires the real checktoken modules).
 */
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { XeapiPublicKeyState } from "@music-api/ncm-crypto";

export interface NcmCoreInit {
	/** Defaults to lazy read of os.tmpdir()/anonymous_token. */
	tokenLoader?: () => string;
	/** Defaults to lazy read of os.tmpdir()/xeapi_public_key (JSON). */
	xeapiKeyLoader?: () => XeapiPublicKeyState | null;
	/** Required when any request sets checkToken 'v2'/'v3'. */
	getCheckToken?: (version: "v2" | "v3") => Promise<string>;
}

const defaultTokenLoader = (): string => {
	const p = join(tmpdir(), "anonymous_token");
	if (!existsSync(p)) {
		throw new Error(
			`[ncm-core] anonymous_token not found at ${p}; generate it first (see api-enhanced generateConfig) or pass tokenLoader to initNcmCore()`,
		);
	}
	return readFileSync(p, "utf-8");
};

const defaultXeapiKeyLoader = (): XeapiPublicKeyState | null => {
	const p = join(tmpdir(), "xeapi_public_key");
	if (!existsSync(p)) return null;
	try {
		return JSON.parse(readFileSync(p, "utf-8")) as XeapiPublicKeyState;
	} catch (error) {
		console.log("[ERR]", error);
		return null;
	}
};

let tokenLoader: () => string = defaultTokenLoader;
let xeapiKeyLoader: () => XeapiPublicKeyState | null = defaultXeapiKeyLoader;
let getCheckTokenFn: ((version: "v2" | "v3") => Promise<string>) | undefined;

let cachedAnonymousToken: string | undefined;
let cachedXeapiKey: XeapiPublicKeyState | null | undefined;

export const initNcmCore = (init: NcmCoreInit = {}): void => {
	if (init.tokenLoader) {
		tokenLoader = init.tokenLoader;
		cachedAnonymousToken = undefined;
	}
	if (init.xeapiKeyLoader) {
		xeapiKeyLoader = init.xeapiKeyLoader;
		cachedXeapiKey = undefined;
	}
	if (init.getCheckToken) getCheckTokenFn = init.getCheckToken;
};

/** Lazy anonymous token (original: read once at require time). */
export const getAnonymousToken = (): string => {
	if (cachedAnonymousToken === undefined) {
		cachedAnonymousToken = tokenLoader();
	}
	return cachedAnonymousToken;
};

/** Lazy xeapi public key (original: loadXeapiPublicKey() with caching). */
export const loadXeapiPublicKey = (): XeapiPublicKeyState | null => {
	if (cachedXeapiKey === undefined) {
		cachedXeapiKey = xeapiKeyLoader();
	}
	return cachedXeapiKey;
};

export const getCheckToken = async (version: "v2" | "v3"): Promise<string> => {
	if (!getCheckTokenFn) {
		throw new Error(
			`[ncm-core] checkToken '${version}' requested but no getCheckToken provider registered; pass one to initNcmCore()`,
		);
	}
	return getCheckTokenFn(version);
};

/** Reset all injected/cached state (tests only). */
export const resetTokenStore = (): void => {
	tokenLoader = defaultTokenLoader;
	xeapiKeyLoader = defaultXeapiKeyLoader;
	getCheckTokenFn = undefined;
	cachedAnonymousToken = undefined;
	cachedXeapiKey = undefined;
};
