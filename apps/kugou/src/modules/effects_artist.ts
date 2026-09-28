// Ported from KuGouMusicApi/module/effects_artist.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 音效 - 明星音效

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			plat: 2,
			version: 12460,
			apiver: 2,
			sort: 1,
			pagesize: params.pagesize || 30,
			page: params.page || 1,
			classify: 1,
		};

		return useAxios({
			baseURL: "http://mobilecdngz.kugou.com",
			url: "/api/v3/sound/list",
			method: "GET",
			params: paramsMap,
			encryptType: "android",
			clearDefaultParams: true,
			cookie: params?.cookie || {},
		});
	},
);
