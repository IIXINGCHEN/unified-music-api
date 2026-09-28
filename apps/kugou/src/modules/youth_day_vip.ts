// Ported from KuGouMusicApi/module/youth_day_vip.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { srcappid } from "@music-api/kugou-crypto";
// 领取vip(领取一天) 需要登录

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/youth/v1/recharge/receive_vip_listen_song",
			encryptType: "android",
			method: "post",
			params: { source_id: 90139, receive_day: params.receive_day },
			headers: { "content-type": "application/x-www-form-urlencoded" },
			cookie: params?.cookie,
		});
	},
);
