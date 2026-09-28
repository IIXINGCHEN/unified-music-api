// @music-api/kugou-crypto — signers.ts
// 手写移植自 KuGouMusicApi/util/helper.js（189 行）。
// 全部基于 MD5：盐 + 排序参数串 [+ body] + 盐。排序语义逐项照搬：
//  - Web 版：先拼 `key=value` 再对整串排序（不是按键排序！golden-vector `sign.web.sortTrap` 锁定）
//  - Android 版：按键排序后拼接；对象值先 JSON.stringify；Buffer body 走增量 MD5
//  - register：只取值排序（module 中零使用，死代码，但保留导出以保兼容）

import { createHash } from "node:crypto";
import {
	liteAppid,
	liteClientver,
	appid as useAppid,
	clientver as useClientver,
} from "./config.js";
import { cryptoMd5 } from "./crypto.js";

const WEB_SALT = "NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt";
const ANDROID_SALT = "OIlwieks28dk2k092lksi2UIkp";
const ANDROID_LITE_SALT = "LnT6xpN3khm36zse0QzvmgTZ3waWdRSA";
const SIGNPARAMS_SALT = "R6snCXJgbCaj9WFRJKefTMIFp0ey6Gza";
const SIGNKEY_SALT = "57ae12eb6890223e355ccfcb74edf70d";
const SIGNKEY_LITE_SALT = "185672dd44712f60bb1736df5a377e82";
const CLOUDKEY_SALT = "ebd1ac3134c880bda6a2194537843caa0162e2e7";

function isLite(): boolean {
	return process.env.platform === "lite";
}

/** Web 版签名：`key=value` 拼串后整体排序 */
export const signatureWebParams = (
	params: Record<string, unknown>,
	data?: string,
): string => {
	const paramsString = Object.keys(params)
		.map((key) => `${key}=${params[key]}`)
		.sort()
		.join("");
	return cryptoMd5(`${WEB_SALT}${paramsString}${data || ""}${WEB_SALT}`);
};

/** Android 版签名：按键排序；对象值 JSON.stringify；Buffer body 增量 MD5 */
export const signatureAndroidParams = (
	params: Record<string, unknown>,
	data?: string | Buffer,
): string => {
	const str = isLite() ? ANDROID_LITE_SALT : ANDROID_SALT;
	const paramsString = Object.keys(params)
		.sort()
		.map(
			(key) =>
				`${key}=${typeof params[key] === "object" ? JSON.stringify(params[key]) : params[key]}`,
		)
		.join("");

	if (Buffer.isBuffer(data)) {
		// 与原 CryptoJS.algo.MD5.create() 增量更新逐字节等价
		const hasher = createHash("md5");
		hasher.update(str, "utf8");
		hasher.update(paramsString, "utf8");
		hasher.update(data);
		hasher.update(str, "utf8");
		return hasher.digest("hex");
	}

	return cryptoMd5(`${str}${paramsString}${data || ""}${str}`);
};

/** 设备注册签名：只取值排序，盐 "1014"（原 module 中零使用，保留） */
export const signatureRegisterParams = (
	params: Record<string, unknown>,
): string => {
	const paramsString = Object.keys(params)
		.map((key) => params[key])
		.sort()
		.join("");
	return cryptoMd5(`1014${paramsString}1014`);
};

/** 通用 sign：按键排序，`key+value` 无等号拼接，盐后置 */
export const signParams = (
	params: Record<string, unknown>,
	data?: string,
): string => {
	const paramsString = Object.keys(params)
		.sort()
		.map((key) => `${key}${params[key]}`)
		.join("");
	return cryptoMd5(`${paramsString}${data || ""}${SIGNPARAMS_SALT}`);
};

/** 请求密钥签名：MD5(hash + 盐 + appid + mid + userid) */
export const signKey = (
	hash: string,
	mid: string,
	userid?: string | number,
	appid?: string | number,
): string => {
	const str = isLite() ? SIGNKEY_LITE_SALT : SIGNKEY_SALT;
	return cryptoMd5(`${hash}${str}${appid || useAppid}${mid}${userid || 0}`);
};

/** 云盘密钥签名：MD5("musicclound" + hash + pid + 盐) */
export const signCloudKey = (hash: string, pid: string): string => {
	return cryptoMd5(`musicclound${hash}${pid}${CLOUDKEY_SALT}`);
};

/** 参数密钥签名：MD5(appid + 盐 + clientver + data) */
export const signParamsKey = (
	data: string | number,
	appid?: string | number,
	clientver?: string | number,
): string => {
	const lite = isLite();
	const str = lite ? ANDROID_LITE_SALT : ANDROID_SALT;
	appid = appid || (lite ? liteAppid : useAppid);
	clientver = clientver || (lite ? liteClientver : useClientver);
	return cryptoMd5(`${appid}${str}${clientver}${data}`);
};
