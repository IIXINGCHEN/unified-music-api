// Ported from KuGouMusicApi/module/scene_audio_list.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { appid, clientver } from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const userid = params?.userid || params?.cookie?.userid || 0;
		const token = params?.token || params.cookie?.token || "";

		const dataMap: Record<string, any> = {
			appid,
			clientver,
			token,
			userid,
		};

		return useAxios({
			url: "/scene/v1/scene/audio_list",
			method: "POST",
			encryptType: "android",
			params: {
				scene_id: params.id,
				module_id: params.module_id,
				tag: params.tag,
				page: params.page || 1,
				page_size: params.pagesize || 30,
			},
			data: dataMap,
			cookie: params?.cookie || {},
		});
	},
);
