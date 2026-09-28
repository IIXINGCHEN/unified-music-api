// 歌曲链接 - v1
// 此版本不再采用 br 作为音质区分的标准
// 而是采用 standard, exhigh, lossless, hires, jyeffect(高清臻音), vivid(臻音全景声), jymaster(超清母带), sky(沉浸环绕声) 进行音质判断
// 当unblock为true时, 会尝试使用unblockmusic-utils进行解锁, 同时音质设置不会生效, 但仍然为必须传入参数
// 当level为sky时, 可通过 immerseType 选择沉浸声类型, 支持 c512(新版c51类型)、ste2(新版环绕立体声类型)、aac2(新版aac类型)、c51(c51类型)、ste(环绕立体声类型)、aac(aac类型), 默认为 c51

import {
	cookieToJson,
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
import { logger } from "../logger.js";

export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		ids: `[${query.id}]`,
		level: query.level,
		encodeType: "flac",
	};
	const options = createOption(query, "xeapi");
	if (query.unblock === "true") {
		try {
			// unblockmusic-utils 未安装时此处抛错 → 被下方 catch 吞掉走正常流程
			// （原 require 在函数体内，语义一致）
			const { matchID } = await import(
				"@neteasecloudmusicapienhanced/unblockmusic-utils"
			);
			const result = await matchID(query.id, query.source);
			logger.info("Starting unblock(uses modules unblock):", query.id, result);
			const useProxy = process.env.ENABLE_PROXY || "false";
			let proxyUrl = "";
			if (result.data.url?.includes("kuwo")) {
				proxyUrl =
					useProxy === "true" && process.env.PROXY_URL
						? process.env.PROXY_URL + result.data.url
						: result.data.url;
			}
			return {
				status: 200,
				body: {
					code: 200,
					msg: "Warning: Customizing unblock sources is not supported on this endpoint. Please use `/song/url/match` instead.",
					data: [
						{
							id: Number(query.id),
							url: result.data.url,
							type: "flac",
							level: query.level,
							freeTrialInfo: "null",
							fee: 0,
							proxyUrl: proxyUrl || "",
						},
					],
				},
				cookie: [],
			};
		} catch (e) {
			console.error("Error in unblocking music:", e);
		}
	}
	// biome-ignore lint/suspicious/noDoubleEquals: query/upstream values are untyped; loose equality matches original
	if (data.level == "sky") {
		(data as Record<string, unknown>).immerseType = query.immerseType || "c51";
	}
	// biome-ignore lint/suspicious/noDoubleEquals: query/upstream values are untyped; loose equality matches original
	if (data.level == "vivid") {
		(data as Record<string, unknown>).encodeType = "mp3";
		const cookie = options.cookie;
		options.cookie = {
			...(typeof cookie === "string" ? cookieToJson(cookie) : cookie),
			os: "android",
			appver: "9.5.61",
		};
	}
	return request(`/api/song/enhance/player/url/v1`, data, options);
});
