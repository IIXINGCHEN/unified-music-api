// Ported from KuGouMusicApi/module/longaudio_album_detail.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const data = (params.album_id || "")
			.split(",")
			.map((s: any) => ({ album_id: s }));
		return useAxios({
			url: `/openapi/v2/broadcast`,
			method: "post",
			encryptType: "android",
			data: {
				data,
				show_album_tag: 1,
				fields:
					"album_name,album_id,category,authors,sizable_cover,intro,author_name,trans_param,album_tag,mix_intro,full_intro,is_publish",
			},
			cookie: params?.cookie || {},
			headers: { "KG-TID": "78" },
		});
	},
);
