/**
 * Port of api-enhanced/generateConfig.js + the anonymous_token bootstrap in
 * app.js.
 *
 * At startup the original:
 *   1. ensures os.tmpdir()/anonymous_token exists (writes "" if missing),
 *   2. sets global.cnIp = generateRandomChineseIP(),
 *   3. calls register_anonimous() and stores cookie MUSIC_A into that file,
 *   4. refreshes os.tmpdir()/xeapi_public_key via getXeapiPublicKey().
 *
 * Each step is failure-tolerant (try/catch + log), matching the original.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	cookieToJson,
	createRequest,
	generateRandomChineseIP,
	getDeviceId,
	type NcmQuery,
	setCnIp,
} from "@music-api/ncm-core";
import { logger } from "./logger.js";
import registerAnonimous from "./modules/register_anonimous.js";
import registerXeapikey from "./modules/register_xeapikey.js";

export async function generateConfig(): Promise<void> {
	setCnIp(generateRandomChineseIP());

	const tokenPath = join(tmpdir(), "anonymous_token");
	if (!existsSync(tokenPath)) {
		writeFileSync(tokenPath, "", "utf-8");
	}

	try {
		const res = await registerAnonimous({} as NcmQuery, createRequest);
		const cookie = (res.body as { cookie?: string } | undefined)?.cookie;
		if (cookie) {
			const cookieObj = cookieToJson(cookie);
			writeFileSync(tokenPath, cookieObj.MUSIC_A ?? "", "utf-8");
		}
	} catch (error) {
		logger.error("generateConfig: register_anonimous failed", { error });
	}

	try {
		const keyPath = join(tmpdir(), "xeapi_public_key");
		let currentPublicKey: { version?: string; sk?: string } = {};
		try {
			currentPublicKey = JSON.parse(readFileSync(keyPath, "utf-8")) as {
				version?: string;
				sk?: string;
			};
		} catch {
			// missing or corrupt key file → treat as empty
		}
		const result = await registerXeapikey(
			{
				deviceId: getDeviceId() ?? "",
				currentKeyVersion: currentPublicKey.version ?? "",
			} as NcmQuery,
			createRequest,
		);
		const publicKey = (result.body ?? {}) as { sk?: string };
		if (!publicKey.sk && currentPublicKey.sk) {
			publicKey.sk = currentPublicKey.sk;
		}
		if (!publicKey.sk) {
			throw new Error("xeapi public key response missing sk");
		}
		writeFileSync(keyPath, JSON.stringify(publicKey), "utf-8");
	} catch (error) {
		logger.error("generateConfig: xeapi public key refresh failed", { error });
	}
}
