// Ported from KuGouMusicApi/module/playlist_detail.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取歌单详情

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const data = (params?.ids || "")
			.split(",")
			.map((s: any) => ({ global_collection_id: s }));

		const dataMap: Record<string, any> = {
			data,
			userid: params?.userid || params?.cookie?.userid || 0,
			token: params?.token || params?.cookie?.token || "",
		};

		return useAxios({
			url: "/v3/get_list_info",
			method: "POST",
			encryptType: "android",
			data: dataMap,
			cookie: params?.cookie || {},
			headers: { "x-router": "pubsongs.kugou.com" },
		});
	},
);
