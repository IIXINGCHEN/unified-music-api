// Ported from KuGouMusicApi/module/everyday_history.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// mode list ,song

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			mode: params.mode || "list",
			platform: params.platform || "ios",
		};

		if (params.history_name) paramsMap["history_name"] = params.history_name;
		if (params.date) paramsMap["date"] = params.date;

		return useAxios({
			url: "/everyday/api/v1/get_history",
			encryptType: "android",
			method: "POST",
			params: paramsMap,
			cookie: params?.cookie || {},
			headers: { "x-router": "everydayrec.service.kugou.com" },
		});
	},
);
