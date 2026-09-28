// Ported from KuGouMusicApi/module/artist_follow_newsongs.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取关注歌手新歌
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const last_album_id = params.last_album_id || 0;
		const page_size = params.pagesize || 30;
		const opt_sort = params.opt_sort === 2 ? 2 : 1;

		const paramsMap: Record<string, any> = {
			last_album_id,
			page_size,
			opt_sort,
		};

		return useAxios({
			url: "/feed/v1/follow/newsong_album_list",
			method: "post",
			data: { last_album_id },
			params: paramsMap,
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
