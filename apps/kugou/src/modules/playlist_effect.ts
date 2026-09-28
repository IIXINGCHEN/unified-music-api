// Ported from KuGouMusicApi/module/playlist_effect.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取音效歌单

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			page: params?.page || 1,
			pagesize: params?.pagesize || 30,
		};

		return useAxios({
			url: "/pubsongs/v1/get_sound_effect_list",
			method: "POST",
			encryptType: "android",
			data: dataMap,
			cookie: params?.cookie || {},
		});
	},
);
