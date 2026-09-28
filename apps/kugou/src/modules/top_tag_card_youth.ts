// Ported from KuGouMusicApi/module/top_tag_card_youth.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 曲风盲盒 · 随机心动

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			tagid: "",
			u_info: "",
			source_mixsong: "",
		};

		return useAxios({
			url: "/youth/v1/song/tag_card_recommend",
			encryptType: "android",
			method: "POST",
			data: dataMap,
			params: {
				ver: "v2",
				area_code: 1,
				platform: "ios",
				module_id: 1,
				clientver: 11490,
			},
			cookie: params?.cookie || {},
		});
	},
);
