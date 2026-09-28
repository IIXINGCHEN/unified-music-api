// Ported from KuGouMusicApi/module/effects_car_brand_lists.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 音效 - 汽车列表

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			plat: 2,
			version: 12460,
			apiver: 2,
			sort: 1,
			pagesize: params.pagesize || 30,
			page: params.page || 1,
			classify: 5,
			rel_id: params.rel_id || 0,
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
