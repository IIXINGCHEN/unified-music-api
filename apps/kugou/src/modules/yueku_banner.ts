// Ported from KuGouMusicApi/module/yueku_banner.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取乐库下的 banner

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			plat: 0,
			channel: 201,
			operator: 7,
			networktype: 2,
			userid: params?.userid || params?.cookie?.userid || 0,
			vip_type: 0,
			m_type: 0,
			tags: [],
			apiver: 5,
			ability: 2,
			mode: "normal",
		};

		return useAxios({
			url: "/ads.gateway/v3/listen_banner",
			encryptType: "android",
			method: "POST",
			data: dataMap,
			cookie: params?.cookie || {},
		});
	},
);
