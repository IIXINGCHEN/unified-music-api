// Ported from KuGouMusicApi/module/effects_brand.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 音效 - 耳机列表

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			sort: 1,
			pagesize: params.pagesize || 30,
			page: params.page || 1,
		};

		return useAxios({
			baseURL: "http://mobilecdngz.kugou.com",
			url: "/api/v5/earphone/get_brand",
			method: "GET",
			params: paramsMap,
			encryptType: "android",
			clearDefaultParams: true,
			cookie: params?.cookie || {},
		});
	},
);
