// Ported from KuGouMusicApi/module/playlist_track_all.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取歌单所有歌曲
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const pagesize = params?.pagesize || 30;
		const paramsMap: Record<string, any> = {
			area_code: 1,
			begin_idx: (Number(params.page || 1) - 1) * pagesize,
			plat: 1,
			type: 1,
			// module: 'NONE',
			mode: 1,
			personal_switch: 1,
			extend_fields: "abtags,hot_cmt,popularization",
			// page: params?.page || 1,
			pagesize,
			global_collection_id: params?.id,
		};

		return useAxios({
			url: "/pubsongs/v2/get_other_list_file_nofilt",
			method: "GET",
			encryptType: "android",
			params: paramsMap,
			cookie: params?.cookie || {},
			// headers: { 'x-router': 'pubsongscdn.kugou.com' },
		});
	},
);
