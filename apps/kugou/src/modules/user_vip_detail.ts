// Ported from KuGouMusicApi/module/user_vip_detail.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			baseURL: "https://kugouvip.kugou.com",
			url: "/v1/get_union_vip",
			method: "GET",
			params: { busi_type: "concept" },
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
