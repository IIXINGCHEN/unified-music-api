// Ported from KuGouMusicApi/module/ai_recommend_song.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			apiver: 2,
			source: 2,
			pagesize: params?.pagesize || 30,
			page: params?.page || 1,
		};

		return useAxios({
			url: "/concepts/v1/ai/recommend_song",
			data: dataMap,
			method: "post",
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
