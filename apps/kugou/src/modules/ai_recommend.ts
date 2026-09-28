// Ported from KuGouMusicApi/module/ai_recommend.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	appid,
	clientver,
	cryptoMd5,
	signParamsKey,
} from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const userid = params?.userid || params?.cookie?.userid || 0;
		const mid = params?.cookie?.KUGOU_API_MID; // 可以自定义
		const clienttime = Date.now();

		const recommend_source = (params?.album_audio_id || "")
			.split(",")
			.map((s: any) => ({ ID: Number(s) }));

		const dataMap: Record<string, any> = {
			platform: "ios",
			clientver,
			clienttime: clienttime,
			userid,
			client_playlist: [],
			source_type: 2,
			playlist_ver: 2,
			area_code: 1,
			appid,
			key: signParamsKey(clienttime.toString()),
			mid,
			recommend_source,
		};

		return useAxios({
			url: "/recommend",
			data: dataMap,
			method: "post",
			encryptType: "android",
			cookie: params?.cookie || {},
			headers: { "x-router": "songlistairec.kugou.com" },
			clearDefaultParams: true,
		});
	},
);
