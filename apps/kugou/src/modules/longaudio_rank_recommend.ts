// Ported from KuGouMusicApi/module/longaudio_rank_recommend.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: `/longaudio/v1/home_new/rank_card_recommend`,
			method: "get",
			encryptType: "android",
			params: { platform: "ios" },
			cookie: params?.cookie || {},
		});
	},
);
