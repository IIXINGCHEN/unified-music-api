// Ported from KuGouMusicApi/module/playlist_tags.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取歌单分类

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			tag_type: "collection",
			tag_id: 0,
			source: 3,
		};

		return useAxios({
			url: "/pubsongs/v1/get_tags_by_type",
			method: "POST",
			encryptType: "android",
			data: dataMap,
			cookie: params?.cookie || {},
		});
	},
);
