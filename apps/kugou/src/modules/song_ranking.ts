// Ported from KuGouMusicApi/module/song_ranking.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 歌曲成绩单

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/grow/v1/song_ranking/play_page/ranking_info",
			method: "GET",
			params: { album_audio_id: params.album_audio_id },
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
