// Ported from KuGouMusicApi/module/youth_channel_similar.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/youth/v1/channel/get_friendly_channel",
			encryptType: "android",
			method: "post",
			data: {
				area_code: 1,
				playlist_ver: 2,
				vip_type: params?.vip_type || params?.cookie?.vip_type || 0,
				platform: "ios",
			},
			params: { channel_id: params.channel_id },
			cookie: params?.cookie,
		});
	},
);
