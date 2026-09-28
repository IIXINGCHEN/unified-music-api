// Ported from KuGouMusicApi/module/everyday_style_recommend.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			platform: params.platform || "ios",
		};

		return useAxios({
			url: "/everydayrec.service/everyday_style_recommend",
			encryptType: "android",
			method: "POST",
			data: {},
			params: { tagids: params.tagids ?? "" },
			cookie: params?.cookie || {},
		});
	},
);
