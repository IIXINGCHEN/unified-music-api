// Ported from KuGouMusicApi/module/youth_channel_amway.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/youth/api/amway/v2/index",
			encryptType: "android",
			method: "get",
			params: { global_collection_id: params.global_collection_id },
			cookie: params?.cookie,
		});
	},
);
