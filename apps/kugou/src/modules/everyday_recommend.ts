// Ported from KuGouMusicApi/module/everyday_recommend.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/everyday_song_recommend",
			encryptType: "android",
			method: "POST",
			params: { platform: params.platform || "ios" },
			cookie: params?.cookie || {},
			headers: { "x-router": "everydayrec.service.kugou.com" },
		});
	},
);
