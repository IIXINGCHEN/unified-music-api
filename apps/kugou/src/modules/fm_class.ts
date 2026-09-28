// Ported from KuGouMusicApi/module/fm_class.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	appid,
	clientver,
	cryptoMd5,
	signParamsKey,
} from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dateTime = Date.now();
		const userid = params?.cookie?.userid || params?.userid || 0;
		const dataMap: Record<string, any> = {
			kguid: userid,
			clienttime: dateTime,
			mid: params?.cookie?.KUGOU_API_MID,
			platform: "android",
			clientver,
			uid: userid,
			get_tracker: 1,
			key: signParamsKey(dateTime),
			appid,
		};

		return useAxios({
			url: "/v1/class_fm_song",
			encryptType: "android",
			method: "POST",
			data: dataMap,
			cookie: params?.cookie || {},
			headers: { "x-router": "fm.service.kugou.com" },
		});
	},
);
