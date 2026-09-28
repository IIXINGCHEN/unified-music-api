// Ported from KuGouMusicApi/module/user_purchased_songs.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { appid, clientver } from "@music-api/kugou-crypto";
// 已购单曲

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			appid,
			userid: Number(params?.cookie?.userid) || 0,
			token: params?.cookie?.token || "",
			page: Number(params?.page) || 1,
			pagesize: Number(params?.pagesize) || 50,
			clientver: String(clientver),
			deleted: 0,
			need_audio_info: 1,
			area_code: "1",
		};

		return useAxios({
			url: "/openapi/copyright/v1/audio/get_goods",
			method: "POST",
			data: dataMap,
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
