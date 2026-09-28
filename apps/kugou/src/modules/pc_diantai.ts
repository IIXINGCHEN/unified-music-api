// Ported from KuGouMusicApi/module/pc_diantai.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 电台 banner
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const userid = params?.cookie?.userid || params?.userid || 0;
		const dataMap: Record<string, any> = {
			isvip: 0,
			userid,
			vipType: 0,
		};
		return useAxios({
			baseURL: "https://adservice.kugou.com",
			url: "/v3/pc_diantai",
			data: dataMap,
			method: "post",
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
