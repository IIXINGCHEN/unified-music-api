// Ported from KuGouMusicApi/module/search_complex.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 综合搜索
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			platform: "AndroidFilter",
			keyword: params.keywords,
			page: params?.page || 1,
			pagesize: params?.pagesize || 30,
			cursor: 0,
		};

		return useAxios({
			baseURL: "https://complexsearch.kugou.com",
			url: "/v6/search/complex",
			method: "GET",
			params: dataMap,
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
