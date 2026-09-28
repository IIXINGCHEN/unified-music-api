// Ported from KuGouMusicApi/module/sheet_detail.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 乐谱详情
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			opern_id: params.id,
		};
		return useAxios({
			url: "/opern/v1/detail/info",
			encryptType: "android",
			method: "GET",
			params: paramsMap,
			cookie: params?.cookie || {},
		});
	},
);
