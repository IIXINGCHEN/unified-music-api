// Ported from KuGouMusicApi/module/lastest_songs_listen.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取继续播放信息
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const token = params?.token || params.cookie?.token || "";
		const userid = Number(params?.userid || params?.cookie?.userid || 0);
		const paramsMap: Record<string, any> = {
			area_code: "1",
			sources: ["pc", "mobile", "tv", "car"],
			userid,
			ret_info: 1,
			token,
			pagesize: Number(params.pagesize || 30),
		};

		return useAxios({
			url: "/playque/devque/v1/get_latest_songs",
			encryptType: "android",
			method: "POST",
			data: paramsMap,
			cookie: params?.cookie || {},
		});
	},
);
