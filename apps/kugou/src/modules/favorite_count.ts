// Ported from KuGouMusicApi/module/favorite_count.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: `/count/v1/audio/mget_collect`,
			method: "GET",
			encryptType: "android",
			cookie: params?.cookie || {},
			params: { mixsongids: params.mixsongids },
		});
	},
);
