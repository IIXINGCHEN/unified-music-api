// Ported from KuGouMusicApi/module/longaudio_week_recommend.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: `/longaudio/v1/home_new/week_new_albums_recommend`,
			method: "post",
			encryptType: "android",
			data: { album_playlist: [] },
			params: { clientver: 12329 },
			cookie: params?.cookie || {},
		});
	},
);
