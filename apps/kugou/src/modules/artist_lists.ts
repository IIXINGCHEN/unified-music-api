// Ported from KuGouMusicApi/module/artist_lists.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 歌手列表
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			musician: Number(params.musician || 0),
			sextype: params.sextypes || 0,
			showtype: 2,
			type: params.type || 0,
			hotsize: Number(params.hotsize || 30),
		};

		return useAxios({
			url: "/ocean/v6/singer/list",
			method: "GET",
			params: paramsMap,
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
