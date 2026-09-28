// Ported from KuGouMusicApi/module/sheet_collection.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { srcappid } from "@music-api/kugou-crypto";

// 乐谱详情
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			srcappid,
			position: params.position ?? 2,
		};
		return useAxios({
			url: "/miniyueku/v1/opern_square/get_home_module_config",
			encryptType: "web",
			method: "GET",
			params: paramsMap,
			cookie: params?.cookie || {},
		});
	},
);
