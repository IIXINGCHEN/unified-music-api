// Ported from KuGouMusicApi/module/artist_honour.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 歌手荣誉详情
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			baseURL: "http://h5activity.kugou.com",
			url: "/v1/query_singer_honour_detail",
			method: "POST",
			params: {
				singer_id: params.id,
				pagesize: params?.pagesize || 30,
				page: params?.page || 1,
			},
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
