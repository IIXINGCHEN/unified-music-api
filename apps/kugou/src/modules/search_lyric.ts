// Ported from KuGouMusicApi/module/search_lyric.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { appid, clientver } from "@music-api/kugou-crypto";
// 歌词搜索

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			album_audio_id: params?.album_audio_id || 0,
			appid,
			clientver,
			duration: params.duration || 0,
			hash: params?.hash || "",
			keyword: params?.keywords || "",
			lrctxt: 1,
			man: params.man ?? "no",
		};

		return useAxios({
			baseURL: "https://lyrics.kugou.com",
			url: "/v1/search",
			method: "GET",
			params: dataMap,
			cookie: params?.cookie || {},
			encryptType: "android",
			clearDefaultParams: true,
		});
	},
);
