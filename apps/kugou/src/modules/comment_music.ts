// Ported from KuGouMusicApi/module/comment_music.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 歌曲评论
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			ver: Number(process.env.CMT_VER || 6),
			mixsongid: params.mixsongid,
			need_show_image: 1,
			p: params.page || 1,
			pagesize: params.pagesize || 30,
			show_classify: params.show_classify || 1,
			show_hotword_list: params.show_hotword_list || 1,
			extdata: "0",
			code: "fc4be23b4e972707f36b8a828a93ba8a",
		};

		return useAxios({
			url: "/mcomment/v1/cmtlist",
			encryptType: "android",
			method: "POST",
			params: paramsMap,
			cookie: params?.cookie || {},
		});
	},
);
