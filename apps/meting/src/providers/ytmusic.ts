/**
 * YTMusic provider — port of src/providers/ytmusic/index.js.
 * Upstream base URL from YT_API, see config.ts.
 */
import { getYtApi } from "../config.js";
import type { ProviderHandle, ProviderRegistry } from "./types.js";

const support_type = ["song", "playlist"];

const handle: ProviderHandle["handle"] = async (type, id, _cookie = "") => {
	if (!support_type.includes(type)) {
		return -1;
	}
	const base = getYtApi();
	if (!base) {
		throw new Error("YouTube Music 上游未配置：请设置 YT_API 环境变量");
	}
	const result = await fetch(`${base}?server=ytmusic&type=${type}&id=${id}`);
	return result.json();
};

export const ytmusicProvider: ProviderHandle = { handle, support_type };

export default {
	register: (ctx: ProviderRegistry): void => {
		ctx.register("ytmusic", ytmusicProvider);
	},
};
