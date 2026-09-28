// Ported from KuGouMusicApi/module/rank_top.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取排行榜推荐列表

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/mobileservice/api/v5/rank/rec_rank_list",
			method: "get",
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
