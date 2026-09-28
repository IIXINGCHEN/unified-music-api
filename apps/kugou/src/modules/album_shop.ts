// Ported from KuGouMusicApi/module/album_shop.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 唱片店
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/zhuanjidata/v3/album_shop_v2/get_classify_data",
			method: "GET",
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
