// Ported from KuGouMusicApi/module/youth_dynamic_recent.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/youth/v3/user/recent_dynamic",
			encryptType: "android",
			method: "get",
			cookie: params?.cookie,
		});
	},
);
