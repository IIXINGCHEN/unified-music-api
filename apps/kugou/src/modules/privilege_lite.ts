// Ported from KuGouMusicApi/module/privilege_lite.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { appid, clientver } from "@music-api/kugou-crypto";
// 获取歌曲信息

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const resource = (params?.hash || "")
			.split(",")
			.map((s: any) => ({ type: "audio", page_id: 0, hash: s, album_id: 0 }));
		(params?.album_id || "").split(",").forEach((s: any, l: any) => {
			resource[l]["album_id"] = s;
		});

		const dataMap: Record<string, any> = {
			appid,
			area_code: 1,
			behavior: "play",
			clientver,
			need_hash_offset: 1,
			relate: 1,
			support_verify: 1,
			resource,
			qualities: [
				"128",
				"320",
				"flac",
				"high",
				"viper_atmos",
				"viper_tape",
				"viper_clear",
				"super",
				"multitrack",
			],
		};

		return useAxios({
			url: "/v2/get_res_privilege/lite",
			data: dataMap,
			method: "post",
			encryptType: "android",
			cookie: params?.cookie || {},
			headers: {
				"x-router": "media.store.kugou.com",
				"Content-Type": "application/json",
			},
		});
	},
);
