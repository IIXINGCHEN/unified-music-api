// Ported from KuGouMusicApi/module/fm_recommend.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { appid, clientver, signParamsKey } from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dateTime = Date.now();
		const dfid = params?.cookie?.dfid || params?.dfid || "-";
		const dataMap: Record<string, any> = {
			appid,
			clientver,
			clienttime: dateTime,
			mid: params?.cookie?.KUGOU_API_MID,
			key: signParamsKey(dateTime),
			rcmdsongcount: 1,
			level: 0,
			area_code: 1,
			get_tracker: 1,
			uid: 0,
		};

		return useAxios({
			url: "/v1/rcmd_list",
			encryptType: "android",
			method: "POST",
			data: dataMap,
			cookie: params?.cookie || {},
			headers: { "x-router": "fm.service.kugou.com" },
		});
	},
);
