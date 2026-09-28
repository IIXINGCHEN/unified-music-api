// Ported from KuGouMusicApi/module/top_album.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { apiver } from "@music-api/kugou-crypto";
// 推荐专辑

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			apiver,
			token: params?.token || params?.cookie?.token || "",
			page: params?.page || 1,
			pagesize: params?.pagesize || 30,
			withpriv: 1,
		};

		return useAxios({
			url: "/musicadservice/v1/mobile_newalbum_sp",
			method: "POST",
			data: dataMap,
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
