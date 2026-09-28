// Ported from KuGouMusicApi/module/song_climax.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取音频高潮部分

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const data = (params?.hash || "").split(",").map((s: any) => ({ hash: s }));

		return useAxios({
			baseURL: "https://expendablekmrcdn.kugou.com",
			url: "/v1/audio_climax/audio",
			method: "GET",
			params: { data: JSON.stringify(data) },
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
