// Ported from KuGouMusicApi/module/comment_music_classify.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 歌曲评论-根据分类获取评论
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			mixsongid: params.mixsongid,
			need_show_image: 1,
			page: params.page || 1,
			pagesize: params.pagesize || 30,
			type_id: params.type_id,
			extdata: "0",
			code: "fc4be23b4e972707f36b8a828a93ba8a",
			sort_method: Number(params.sort) === 2 ? params.sort : 1,
		};

		return useAxios({
			url: "/mcomment/v1/cmt_classify_list",
			encryptType: "android",
			method: "POST",
			params: paramsMap,
			cookie: params?.cookie || {},
		});
	},
);
