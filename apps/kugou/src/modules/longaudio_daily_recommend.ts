// Ported from KuGouMusicApi/module/longaudio_daily_recommend.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: `/longaudio/v1/home_new/daily_recommend`,
			method: "post",
			encryptType: "android",
			params: {
				module_id: 1,
				size: params.pagesize || 30,
				page: params.page || 1,
			},
			cookie: params?.cookie || {},
		});
	},
);
