// Ported from KuGouMusicApi/module/song_barrage_send.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	badRequest,
	buildSongBarrageListConfig,
	buildSongBarrageSendConfig,
	extractResolvedResource,
	firstValue,
} from "./_comment.js";
// 发送歌曲弹幕；仅传 hash 时先查询并解析 special_id

export default defineKgModule(
	async (params: Record<string, any>, useAxios: KgRequestFn) => {
		if (!`${params.content || ""}`.trim()) {
			return badRequest("content 不能为空");
		}

		let specialId = firstValue(params.special_id, params.childrenid, params.id);
		let name = firstValue(params.name, params.song_name, params.childrenname);

		if (!specialId) {
			const hash = firstValue(params.hash, params.schash, params.extdata);
			if (!hash) {
				return badRequest("special_id 和 hash 至少需要传入一个");
			}

			const lookupResponse: any = await useAxios(
				buildSongBarrageListConfig({
					...params,
					page: 1,
					pagesize: 1,
				}),
			);
			const resolved = extractResolvedResource(lookupResponse);
			specialId = resolved.id;
			name = name || resolved.name;
		}

		if (!specialId) {
			return badRequest("无法根据 hash 解析歌曲弹幕 special_id");
		}

		return useAxios(
			buildSongBarrageSendConfig({
				...params,
				special_id: specialId,
				name,
			}),
		);
	},
);
