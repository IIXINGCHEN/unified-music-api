// Ported from KuGouMusicApi/module/user_video_collect.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { cryptoRSAEncrypt } from "@music-api/kugou-crypto";

/**
 * 获取用户关注的歌手
 */
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const token = params?.token || params?.cookie?.token || "";
		const userid = params?.userid || params?.cookie?.userid || "0";
		const dataMap: Record<string, any> = {
			userid,
			token,
			page: params?.page ?? 1,
			pagesize: params?.pagesize ?? 30,
		};

		return useAxios({
			url: "/collectservice/v2/collect_list_mixvideo",
			encryptType: "android",
			method: "POST",
			data: dataMap,
			params: { plat: 1 },
			cookie: params?.cookie || {},
		});
	},
);
