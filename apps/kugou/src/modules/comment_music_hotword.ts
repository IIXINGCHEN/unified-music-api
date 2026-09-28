// Ported from KuGouMusicApi/module/comment_music_hotword.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 歌曲评论-更具热词获取评论
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			mixsongid: params.mixsongid,
			need_show_image: 1,
			p: params.page || 1,
			pagesize: params.pagesize || 30,
			hot_word: params.hot_word,
			extdata: "0",
			code: "fc4be23b4e972707f36b8a828a93ba8a",
		};

		return useAxios({
			url: "/mcomment/v1/get_hot_word",
			encryptType: "android",
			method: "POST",
			params: paramsMap,
			cookie: params?.cookie || {},
		});
	},
);
