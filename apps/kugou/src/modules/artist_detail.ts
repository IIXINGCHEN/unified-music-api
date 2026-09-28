// Ported from KuGouMusicApi/module/artist_detail.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 歌手详情
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/kmr/v3/author",
			method: "POST",
			data: { author_id: params.id },
			encryptType: "android",
			cookie: params?.cookie || {},
			headers: { "x-router": "openapi.kugou.com", "kg-tid": 36 },
		});
	},
);
