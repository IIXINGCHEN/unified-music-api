// Ported from KuGouMusicApi/module/youth_channel_song_list.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			global_collection_id: params.global_collection_id,
			pagesize: params.pagesize || 20,
			page: params.page || 1,
			types: 2,
			is_filter: 0,
			apiver: 3,
		};
		return useAxios({
			baseURL: "https://youth.kugou.com",
			url: "/api/channel/v1/channel_get_song_list",
			encryptType: "android",
			method: "GET",
			params: dataMap,
			cookie: params?.cookie,
		});
	},
);
