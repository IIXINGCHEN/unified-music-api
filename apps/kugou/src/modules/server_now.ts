// Ported from KuGouMusicApi/module/server_now.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取服务器时间
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const userid = params?.userid || params?.cookie?.userid || 0;
		const token = params?.token || params?.cookie?.token || "";

		return useAxios({
			url: "/v1/server_now",
			data: { token, userid },
			encryptType: "android",
			method: "POST",
			params: { plat: 3 },
			cookie: params?.cookie || {},
			headers: { "x-router": "usercenter.kugou.com" },
		});
	},
);
