// @music-api/kugou-core — device.ts
// 设备指纹管理器。逻辑移植自 KuGouMusicApi/server.js 的平台标识 Cookie 注入中间件；
// GUID/MID/WEBGL 的生成算法复用 @music-api/kugou-crypto（不重复实现）。

import {
	calculateMid,
	cryptoMd5,
	generateWebGLHash,
	getGuid,
	isUUIDv4,
	randomString,
} from "@music-api/kugou-crypto";

/** 设备标识集合（对应 KUGOU_API_* Cookie） */
export interface DeviceIds {
	/** 平台类型：process.env.platform（可能 undefined，与原实现一致） */
	platform: string | undefined;
	/** calculateMid(guid) 的十进制字符串 */
	mid: string;
	/** cryptoMd5(UUIDv4)，或环境变量覆盖值 */
	guid: string;
	/** 启动时随机 10 位大写，或 KUGOU_API_DEV */
	dev: string;
	/** KUGOU_API_MAC 或默认 02:00:00:00:00:00（大写） */
	mac: string;
	/** generateWebGLHash() 或 KUGOU_API_WEBGL */
	webgl: string;
}

export interface DeviceIdOptions {
	/** DEV 生成器（默认随机 10 位大写）；可注入以保证测试确定性 */
	devGenerator?: () => string;
	/** WEBGL 生成器（默认 generateWebGLHash）；可注入 */
	webglGenerator?: () => string;
}

const DEFAULT_MAC = "02:00:00:00:00:00";

/**
 * 生成设备标识。环境变量覆盖规则与原 server.js 完全一致：
 * - KUGOU_API_GUID：是合法 UUIDv4 则取其 MD5，否则原样使用；未设置则用启动时生成的 guid
 * - KUGOU_API_DEV / KUGOU_API_MAC：未设置时用生成值/默认值（统一大写）
 * - KUGOU_API_WEBGL：未设置时调用 webglGenerator
 */
export function createDeviceIds(options: DeviceIdOptions = {}): DeviceIds {
	const bootGuid = cryptoMd5(getGuid());
	const envGuidRaw = process.env.KUGOU_API_GUID;
	const envGuid =
		envGuidRaw !== undefined && envGuidRaw !== ""
			? isUUIDv4(envGuidRaw)
				? cryptoMd5(envGuidRaw)
				: envGuidRaw
			: undefined;
	const guid = envGuid ?? bootGuid;

	const devGenerator = options.devGenerator ?? (() => randomString(10));
	const webglGenerator = options.webglGenerator ?? generateWebGLHash;

	return {
		platform: process.env.platform,
		mid: calculateMid(guid),
		guid,
		dev: (process.env.KUGOU_API_DEV ?? devGenerator()).toUpperCase(),
		mac: (process.env.KUGOU_API_MAC ?? DEFAULT_MAC).toUpperCase(),
		webgl: process.env.KUGOU_API_WEBGL ?? webglGenerator(),
	};
}

/**
 * 纯函数版 Cookie 补齐：客户端未提供的 KUGOU_API_* 键用设备标识补上
 *（Set-Cookie 写回由 P3 的 Hono 中间件负责，此处只做合并）。
 */
export function ensureDeviceCookies(
	existing: Record<string, string>,
	device: DeviceIds,
): Record<string, string> {
	const merged: Record<string, string> = { ...existing };
	const inject = (key: string, value: string | undefined) => {
		if (Object.hasOwn(merged, key)) return;
		// 原实现：cookies[key] = String(value)，undefined 会变成 "undefined" 字符串，此处保持一致。
		merged[key] = String(value);
	};
	inject("KUGOU_API_PLATFORM", device.platform);
	inject("KUGOU_API_MID", device.mid);
	inject("KUGOU_API_GUID", device.guid);
	inject("KUGOU_API_DEV", device.dev);
	inject("KUGOU_API_MAC", device.mac);
	inject("KUGOU_API_WEBGL", device.webgl);
	return merged;
}
