// Ported from KuGouMusicApi/module/search_hot.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 热搜
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			navid: 1,
			plat: 2,
		};

		return useAxios({
			url: "/api/v3/search/hot_tab",
			method: "GET",
			params: dataMap,
			encryptType: "android",
			cookie: params?.cookie || {},
			headers: { "x-router": "msearch.kugou.com" },
		});
	},
);
