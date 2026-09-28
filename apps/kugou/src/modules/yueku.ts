// Ported from KuGouMusicApi/module/yueku.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取安卓乐库相关内容

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/v1/yueku/recommend_v2",
			encryptType: "android",
			method: "GET",
			params: { operator: 7, plat: 0, type: 11, area_code: 1, req_multi: 1 },
			cookie: params?.cookie || {},
			headers: { "x-router": "service.mobile.kugou.com" },
		});
	},
);
