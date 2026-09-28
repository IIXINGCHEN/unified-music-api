// Ported from KuGouMusicApi/module/youth_listen_song.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 听歌领取vip 需要登录
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			mixsongid: params?.mixsongid || 666075191,
		};

		return useAxios({
			url: "/youth/v2/report/listen_song",
			data: dataMap,
			method: "POST",
			params: { clientver: 10566 },
			cookie: params?.cookie,
			headers: {
				"user-agent":
					"Android13-1070-10566-201-0-ReportPlaySongToServerProtocol-wifi",
				"content-type": "application/json; charset=utf-8",
			},
		});
	},
);
