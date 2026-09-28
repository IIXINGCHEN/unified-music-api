// Ported from KuGouMusicApi/module/rank_vol.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取排行榜往期列表
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const parmasMap: Record<string, any> = {
			rank_cid: params.rank_cid || 0,
			rankid: params.rankid,
			ranktype: 1,
			type: 0,
			plat: 2,
		};

		return useAxios({
			url: "/ocean/v6/rank/vol",
			method: "get",
			encryptType: "android",
			params: parmasMap,
			cookie: params?.cookie || {},
		});
	},
);
