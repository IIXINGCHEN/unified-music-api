// Ported from KuGouMusicApi/module/effects_match.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 音效 - 通用耳机音效

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			plat: 2,
			version: 12460,
		};

		return useAxios({
			baseURL: "http://mobilecdngz.kugou.com",
			url: "/api/v5/earphone/match",
			method: "GET",
			params: paramsMap,
			encryptType: "android",
			clearDefaultParams: true,
			cookie: params?.cookie || {},
		});
	},
);
