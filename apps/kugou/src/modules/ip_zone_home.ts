// Ported from KuGouMusicApi/module/ip_zone_home.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取今日推荐信息，有可能为空
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			id: params?.id,
			share: 0,
		};

		return useAxios({
			url: "/v1/zone/home",
			encryptType: "android",
			method: "GET",
			params: dataMap,
			cookie: params?.cookie || {},
			headers: { "x-router": "yuekucategory.kugou.com" },
		});
	},
);
