// Ported from KuGouMusicApi/module/artist_albums.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取歌手专辑

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			author_id: params.id,
			pagesize: params?.pagesize || 30,
			page: params?.page || 1,
			sort: params?.sort === "hot" ? 3 : 1, // 3：最热，1：最新
			category: 1,
			area_code: "all",
		};

		return useAxios({
			url: "/kmr/v1/author/albums",
			method: "POST",
			data: dataMap,
			encryptType: "android",
			cookie: params?.cookie || {},
			headers: { "x-router": "openapi.kugou.com", "kg-tid": 36 },
		});
	},
);
