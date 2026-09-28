// Ported from KuGouMusicApi/module/song_ranking_filter.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 歌曲成绩单

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/grow/v1/song_ranking/unlock/v2/ranking_filter",
			method: "GET",
			params: {
				album_audio_id: params.album_audio_id,
				page: params.page || 1,
				pagesize: params.pagesize || 30,
			},
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
