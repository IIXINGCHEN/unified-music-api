// 网易云歌曲解灰(适配SPlayer的UNM-Server)
// 支持qq音乐、酷狗音乐、酷我音乐、咪咕音乐、第三方网易云API等等(来自GD音乐台)

import {
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
import { logger } from "../logger.js";

export default defineModule(async (query: NcmQuery, _request: NcmRequestFn) => {
	try {
		// unblockmusic-utils 未安装时此处抛错 → 被 catch 转为 500（原 require 同）
		const { matchID } = await import(
			"@neteasecloudmusicapienhanced/unblockmusic-utils"
		);
		const result = await matchID(query.id, query.source);
		const proxy = process.env.PROXY_URL;
		logger.info("开始解灰", query.id, result);
		const useProxy = process.env.ENABLE_PROXY || "false";
		if (result.data.url?.includes("kuwo")) {
			result.proxyUrl =
				useProxy === "true" ? proxy + result.data.url : result.data.url;
		}
		return {
			status: 200,
			body: {
				code: 200,
				data: result.data.url,
				proxyUrl: result.proxyUrl || "",
			},
		};
	} catch (e) {
		return {
			status: 500,
			body: {
				code: 500,
				msg: (e as Error).message || "unblock error",
				data: [],
			},
		};
	}
});
