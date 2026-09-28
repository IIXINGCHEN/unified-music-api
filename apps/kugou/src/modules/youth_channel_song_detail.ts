// Ported from KuGouMusicApi/module/youth_channel_song_detail.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			global_collection_id: params.global_collection_id,
			fileid: params.fileid,
		};
		return useAxios({
			url: "/youth/v2/post/get_song_detail",
			encryptType: "android",
			method: "get",
			params: dataMap,
			cookie: params?.cookie,
		});
	},
);
