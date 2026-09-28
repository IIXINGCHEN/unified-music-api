// Ported from KuGouMusicApi/module/artist_audios.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	appid,
	clientver,
	cryptoMd5,
	signParamsKey,
} from "@music-api/kugou-crypto";

// 获取歌手单曲

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const clienttime = Math.floor(new Date().getTime() / 1000);
		const mid = params?.cookie?.KUGOU_API_MID;
		const dataMap: Record<string, any> = {
			appid,
			clientver,
			mid,
			clienttime,
			key: signParamsKey(clienttime),
			author_id: params.id,
			pagesize: params?.pagesize || 30,
			page: params?.page || 1,
			sort: params?.sort === "hot" ? 1 : 2, // 1：最热，2：最新
			area_code: "all",
		};

		return useAxios({
			baseURL: "https://openapi.kugou.com",
			url: "/kmr/v1/audio_group/author",
			method: "POST",
			data: dataMap,
			encryptType: "android",
			cookie: params?.cookie || {},
			headers: { "x-router": "openapi.kugou.com", "kg-tid": 220 },
		});
	},
);
