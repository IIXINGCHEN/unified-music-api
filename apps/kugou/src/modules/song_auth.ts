// Ported from KuGouMusicApi/module/song_auth.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const authorization = params.auth || params.cookie.auth || "";

		const dataMap: Record<string, any> = {
			authorization,
			module_id: 51,
			album_audio_id: Number(params.album_audio_id ?? 0),
			clientver: 11561,
			hash: (params?.hash || "").toLowerCase(),
		};

		return useAxios({
			baseURL: "http://trackercdngz.kugou.com/",
			url: "/v1/authorization",
			method: "GET",
			params: dataMap,
			encryptType: "android",
			cookie: Object.assign({}, params?.cookie),
		});
	},
);
