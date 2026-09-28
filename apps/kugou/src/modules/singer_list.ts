// Ported from KuGouMusicApi/module/singer_list.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取歌手列表
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/ocean/v6/singer/list",
			encryptType: "android",
			method: "GET",
			params: {
				hotsize: params?.hotsize ?? 200,
				musician: 0,
				sextype: params?.sextype ?? 0,
				showtype: 2,
				type: params?.type ?? 0,
			},
			cookie: params?.cookie || {},
		});
	},
);
