// Ported from KuGouMusicApi/module/theme_playlist_track.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { clientver } from "@music-api/kugou-crypto";
// 获取主题歌单说有歌曲

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			platform: "android",
			clientver,
			clienttime: Date.now(),
			area_code: 1,
			module_id: 1,
			userid: params?.userid || params?.cookie?.userid || 0,
			theme_id: params?.theme_id,
		};

		return useAxios({
			url: "/v2/gettheme_songidlist",
			method: "POST",
			encryptType: "android",
			data: dataMap,
			cookie: params?.cookie || {},
			headers: { "x-router": "everydayrec.service.kugou.com" },
		});
	},
);
