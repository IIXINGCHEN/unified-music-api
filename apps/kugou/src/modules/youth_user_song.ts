// Ported from KuGouMusicApi/module/youth_user_song.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			filter_video: 0,
			type: params?.type || 0,
			userid: params.userid,
			pagesize: params.pagesize || 30,
			page: params.page || 1,
			is_filter: 0,
		};
		return useAxios({
			url: "/youth/v1/get_user_song_public",
			encryptType: "android",
			method: "get",
			params: dataMap,
			cookie: params?.cookie,
		});
	},
);
