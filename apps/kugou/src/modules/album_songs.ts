// Ported from KuGouMusicApi/module/album_songs.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 专辑音乐列表
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			album_id: params.id,
			is_buy: params?.is_buy || "",
			page: params?.page || 1,
			pagesize: params?.pagesize || 30,
		};

		return useAxios({
			url: "/v1/album_audio/lite",
			method: "POST",
			data: dataMap,
			encryptType: "android",
			cookie: params?.cookie || {},
			headers: { "x-router": "openapi.kugou.com", "kg-tid": "255" },
		});
	},
);
