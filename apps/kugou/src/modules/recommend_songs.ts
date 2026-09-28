// Ported from KuGouMusicApi/module/recommend_songs.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 每日推荐歌曲

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			platform: params?.platform || "android",
			userid: params?.userid || params?.cookie?.userid || "0",
		};

		return useAxios({
			url: "/everyday_song_recommend",
			method: "POST",
			data: dataMap,
			encryptType: "android",
			cookie: params?.cookie || {},
			headers: { "x-router": "everydayrec.service.kugou.com" },
		});
	},
);
