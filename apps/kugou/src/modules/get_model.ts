// Ported from KuGouMusicApi/module/get_model.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取社区音效

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			super_vip: 1,
			sound_ver: 2,
			page: params.page || 1,
			pagesize: params.pagesize || 30,
			apiver: 3,
			classify: "2,3",
			plat: 2,
			privilege: 1,
			sort: params.sort || 2,
		};

		return useAxios({
			url: "/ocean/v6/sound/list",
			encryptType: "android",
			method: "GET",
			params: dataMap,
			cookie: params?.cookie || {},
		});
	},
);
