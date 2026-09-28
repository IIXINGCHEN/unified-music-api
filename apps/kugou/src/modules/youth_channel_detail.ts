// Ported from KuGouMusicApi/module/youth_channel_detail.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const data = (params.global_collection_id || "")
			.split(",")
			.map((s: any) => ({ global_collection_id: s }));
		return useAxios({
			url: "/youth/api/channel/v1/channel_list_by_id",
			encryptType: "android",
			method: "post",
			data: { data },
			cookie: params?.cookie,
		});
	},
);
