// Ported from KuGouMusicApi/module/longaudio_album_audios.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: `/longaudio/v2/album_audios`,
			method: "post",
			encryptType: "android",
			data: {
				album_id: params.album_id,
				area_code: 1,
				tagid: 0,
				page: params.page || 1,
				pagesize: params.pagesize || 30,
			},
			cookie: params?.cookie || {},
			headers: { "x-router": "openapi.kugou.com", "KG-TID": "78" },
		});
	},
);
