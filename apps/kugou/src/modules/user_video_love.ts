// Ported from KuGouMusicApi/module/user_video_love.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { cryptoRSAEncrypt } from "@music-api/kugou-crypto";

/**
 * 获取用户关注的歌手
 */
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const userid = params?.userid || params?.cookie?.userid || "0";
		const paramsMap: Record<string, any> = {
			kugouid: userid,
			pagesize: params?.pagesize ?? 30,
			load_video_info: 1,
			p: 1,
			plat: 1,
		};

		return useAxios({
			url: "/m.comment.service/v1/get_user_like_video",
			encryptType: "android",
			method: "get",
			params: paramsMap,
			cookie: params?.cookie || {},
		});
	},
);
