// Ported from KuGouMusicApi/module/ip_dateil.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取ip详情
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const data = (params?.id || "").split(",").map((s: any) => ({ ip_id: s }));

		const dataMap: Record<string, any> = {
			data,
			is_publish: 1,
		};

		return useAxios({
			url: "/openapi/v1/ip",
			encryptType: "android",
			method: "POST",
			data: dataMap,
			cookie: params?.cookie || {},
		});
	},
);
