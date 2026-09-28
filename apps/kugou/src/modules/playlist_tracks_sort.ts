// Ported from KuGouMusicApi/module/playlist_tracks_sort.js — behavior identical to the original.
import {
	createCloudRequest,
	defineKgModule,
	type KgRequestFn,
} from "@music-api/kugou-core";
// 对歌单内歌曲排序（自定义排序，可对「我喜欢」歌单使用）
// 使用云歌单服务加密协议（cloudlist.service.kugou.com）
// listid: 歌单 listid
// type: 歌单类型，0=自建/我喜欢，1=收藏
// list_ver: 歌单列表版本号（歌单歌曲接口返回的 list_ver）
// data: 排序数据，格式为 fileid|sort，多个用逗号分隔

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const resource = (params.data || "").split(",").map((s: any) => {
			const [fileid, sort] = s.split("|");
			return { fileid: Number(fileid), sort: Number(sort || 0) };
		});

		const dataMap: Record<string, any> = {
			listid: Number(params.listid),
			list_ver: Number(params.list_ver || 0),
			type: Number(params.type || 0),
			data: resource,
		};

		return createCloudRequest({
			url: "/v1/modify_song_sort",
			data: dataMap,
			cookie: params?.cookie || {},
		});
	},
);
