// Ported from KuGouMusicApi/module/rank_info.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取排行榜详情
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const parmasMap: Record<string, any> = {
			rank_cid: params.rank_cid || 0,
			rankid: params.rankid,
			with_album_img: params.album_img || 1,
			zone: params.zone || "",
		};

		return useAxios({
			url: "/ocean/v6/rank/info",
			method: "get",
			encryptType: "android",
			params: parmasMap,
			cookie: params?.cookie || {},
		});
	},
);
