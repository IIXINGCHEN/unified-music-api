// Ported from KuGouMusicApi/module/rank_list.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取排行榜列表

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const parmasMap: Record<string, any> = {
			plat: 2,
			withsong: params.withsong || 1,
			parentid: 0,
		};

		return useAxios({
			url: "/ocean/v6/rank/list",
			method: "get",
			encryptType: "android",
			params: parmasMap,
			cookie: params?.cookie || {},
		});
	},
);
