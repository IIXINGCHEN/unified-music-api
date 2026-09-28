// Ported from KuGouMusicApi/module/youth_channel_sub.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const t = Number(params.t) === 0 ? 0 : 1;
		return useAxios({
			url: `/youth/v1/channel${t === 0 ? "_un" : ""}_subscribe`,
			encryptType: "android",
			method: t === 0 ? "delete" : "post",
			params: { global_collection_id: params.global_collection_id, source: 1 },
			cookie: params?.cookie,
		});
	},
);
