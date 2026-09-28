// Ported from KuGouMusicApi/module/youth_month_vip_record.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/youth/v1/activity/get_month_vip_record",
			encryptType: "android",
			params: { latest_limit: 100 },
			method: "get",
			cookie: params?.cookie,
		});
	},
);
