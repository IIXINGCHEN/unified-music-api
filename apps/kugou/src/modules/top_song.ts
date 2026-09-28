// Ported from KuGouMusicApi/module/top_song.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
/**
 * 新歌速递
 */
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			rank_id: params?.type || 21608,
			userid: params?.userid || params?.cookie?.userid || 0,
			page: params?.page || 1,
			pagesize: params?.pagesize || 30,
			tags: [],
		};

		return useAxios({
			url: "/musicadservice/container/v1/newsong_publish",
			encryptType: "android",
			method: "POST",
			data: dataMap,
			cookie: params?.cookie || {},
		});
	},
);
