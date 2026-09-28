// Ported from KuGouMusicApi/module/comment_floor_send.js — behavior identical to the original.
// 发送楼层回复，支持歌曲、专辑和歌单评论池。额外导出 resolveCode（原版挂在 module.exports 上）。
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	ALBUM_COMMENT_CODE,
	badRequest,
	buildCommentReplyConfig,
	extractResolvedResource,
	firstValue,
	PLAYLIST_COMMENT_CODE,
	SONG_COMMENT_CODE,
} from "./_comment.js";
import commentFloor from "./comment_floor.js";

export const resolveCode = (params: Record<string, any> = {}): string => {
	const explicitCode = firstValue(params.code);
	if (explicitCode) return `${explicitCode}`;

	const resourceType =
		`${firstValue(params.resource_type, params.resourceType, "song")}`.toLowerCase();
	if (resourceType === "album") return ALBUM_COMMENT_CODE;
	if (resourceType === "playlist") return PLAYLIST_COMMENT_CODE;
	return SONG_COMMENT_CODE;
};

export default defineKgModule(
	async (params: Record<string, any>, useAxios: KgRequestFn) => {
		if (!`${params.content || ""}`.trim()) {
			return badRequest("content 不能为空");
		}

		const specialId = firstValue(
			params.special_id,
			params.childrenid,
			params.id,
		);
		if (!specialId) {
			return badRequest("special_id 不能为空");
		}
		if (!firstValue(params.tid)) {
			return badRequest("tid 不能为空");
		}

		const code = resolveCode(params);
		let name: any = firstValue(
			params.name,
			params.song_name,
			params.album_name,
			params.playlist_name,
			params.childrenname,
		);

		if (!name) {
			const lookupResponse: any = await commentFloor(
				{
					...params,
					special_id: specialId,
					code,
					page: 1,
					pagesize: 1,
				},
				useAxios,
			);
			name = extractResolvedResource(lookupResponse).name;
		}

		return useAxios(
			buildCommentReplyConfig(
				{
					...params,
					special_id: specialId,
					name,
				},
				code,
			),
		);
	},
);
