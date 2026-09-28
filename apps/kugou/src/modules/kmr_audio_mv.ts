// Ported from KuGouMusicApi/module/kmr_audio_mv.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { appid, clientver } from "@music-api/kugou-crypto";

// 根据 album_audio_id/MixSongID 获取歌曲 相对应的 mv
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const resource = (params?.album_audio_id || "")
			.split(",")
			.map((s: any) => ({ album_audio_id: s }));

		const paramsMap: Record<string, any> = {
			data: resource,
			fields: params.fields || "",
		};

		return useAxios({
			url: "/kmr/v1/audio/mv",
			method: "POST",
			data: paramsMap,
			encryptType: "android",
			cookie: params?.cookie || {},
			headers: { "x-router": "openapi.kugou.com", "KG-TID": 38 },
		});
	},
);
