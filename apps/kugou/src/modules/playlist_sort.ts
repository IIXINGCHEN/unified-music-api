// Ported from KuGouMusicApi/module/playlist_sort.js — behavior identical to the original.
import {
	createCloudRequest,
	defineKgModule,
	type KgRequestFn,
} from "@music-api/kugou-core";
// 对「我的歌单」列表排序（自建歌单/收藏歌单）
// 使用云歌单服务加密协议（cloudlist.service.kugou.com）
// total_ver: 歌单总版本号（用户歌单接口返回的 total_ver）
// type: 歌单类别，0=自建歌单，1=收藏歌单（sort 按类别分开编号）
// data: 排序数据，格式为 listid|type|sort，多个用逗号分隔

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const resource = (params.data || "").split(",").map((s: any) => {
			const [listid, type, sort] = s.split("|");
			return {
				listid: Number(listid),
				type: Number(type || 0),
				sort: Number(sort || 0),
			};
		});

		const dataMap: Record<string, any> = {
			total_ver: Number(params.total_ver || 0),
			data: resource,
		};

		return createCloudRequest({
			url: "/v1/modify_list_sort",
			data: dataMap,
			cookie: params?.cookie || {},
		});
	},
);
