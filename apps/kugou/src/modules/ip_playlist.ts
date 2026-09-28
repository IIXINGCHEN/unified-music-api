// Ported from KuGouMusicApi/module/ip_playlist.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 根据 ip 获取相对于歌单
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			ip: params?.id,
			page: params?.page || 1,
			pagesize: params?.pagesize || 30,
		};

		return useAxios({
			url: "/ocean/v6/pubsongs/list_info_for_ip",
			encryptType: "android",
			method: "POST",
			params: dataMap,
			cookie: params?.cookie || {},
		});
	},
);
