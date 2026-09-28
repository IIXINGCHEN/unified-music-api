// Ported from KuGouMusicApi/module/youth_channel_all.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/youth/v2/channel/channel_all_list",
			encryptType: "android",
			method: "get",
			params: {
				page: params.page || 1,
				pagesize: params.pagesize || 30,
				type: 1,
			},
			cookie: params?.cookie,
		});
	},
);
