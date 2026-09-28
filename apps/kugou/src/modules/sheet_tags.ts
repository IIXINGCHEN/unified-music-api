// Ported from KuGouMusicApi/module/sheet_tags.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";

// 获取乐谱 tag
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/opern/v1/home/get_tags",
			encryptType: "android",
			method: "GET",
			cookie: params?.cookie || {},
		});
	},
);
