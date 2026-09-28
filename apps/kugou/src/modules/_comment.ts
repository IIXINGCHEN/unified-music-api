// 内部辅助：KuGouMusicApi/module/_comment.js 的 TS 移植。
// 不挂载路由，仅供评论/弹幕模块内部复用；行为与原版逐行一致。

import type {
	KgRequestFn,
	KgRequestOptions,
	KgResponse,
} from "@music-api/kugou-core";
import { appid, clientver, signParamsKey } from "@music-api/kugou-crypto";

// ---------- _comment.js ----------
const COMMENT_HOST = "m.comment.service.kugou.com";
export const SONG_COMMENT_CODE = "fc4be23b4e972707f36b8a828a93ba8a";
export const ALBUM_COMMENT_CODE = "94f1792ced1df89aa68a7939eaf2efca";
export const PLAYLIST_COMMENT_CODE = "ca53b96fe5a1d9c22d71c8f522ef7c4f";
export const SONG_BARRAGE_CODE = "articulossong";
export const VIDEO_BARRAGE_CODE = "db3664c219a6e350b00ab08d7f723a79";

export const firstValue = (...values: any[]): any =>
	values.find(
		(value) => value !== undefined && value !== null && `${value}` !== "",
	);

const compact = (object: Record<string, any>): Record<string, any> =>
	Object.fromEntries(
		Object.entries(object).filter(
			([, value]) =>
				value !== undefined &&
				value !== null &&
				(typeof value !== "string" || value !== ""),
		),
	);

/** 400 信封（原版直接返回该对象；类型按 any 处理以兼容同步/异步模块返回） */
export const badRequest = (message: string): any => ({
	status: 400,
	body: {
		status: 0,
		error_code: 400,
		msg: message,
	},
	cookie: [],
	headers: {},
});

const getIdentity = (params: Record<string, any> = {}) => {
	const cookie = params.cookie || {};
	const clienttime = Number(
		firstValue(params.clienttime, Math.floor(Date.now() / 1000)),
	);
	const mid = `${firstValue(params.mid, cookie.KUGOU_API_MID) ?? ""}`;
	const token = `${firstValue(params.clienttoken, params.token, cookie.token) ?? ""}`;
	const userid = firstValue(params.kugouid, params.userid, cookie.userid, 0);
	const dfid = `${firstValue(params.dfid, cookie.dfid, "-")}`;
	const uuid = `${firstValue(params.uuid, cookie.uuid, "-")}`;

	return { clienttime, mid, token, userid, dfid, uuid };
};

const getListAuthParams = (
	params: Record<string, any> = {},
): Record<string, any> => {
	const { clienttime, mid, token, userid, dfid, uuid } = getIdentity(params);

	return {
		kugouid: userid,
		ver: firstValue(params.ver, 6),
		clienttoken: token,
		appid,
		clientver,
		mid,
		clienttime,
		key: signParamsKey(`${clienttime}`),
		uuid,
		dfid,
	};
};

const commentRequestConfig = (
	params: Record<string, any>,
	query: Record<string, any>,
	method = "GET",
	data?: string,
): KgRequestOptions => ({
	url: "/index.php",
	method,
	params: compact(query),
	data,
	cookie: params?.cookie || {},
	clearDefaultParams: true,
	notSignature: true,
	headers: compact({
		"x-router": COMMENT_HOST,
		"Content-Type": data ? "application/json; charset=UTF-8" : undefined,
	}),
});

export const buildSongBarrageListConfig = (
	params: Record<string, any> = {},
): KgRequestOptions => {
	const specialId = firstValue(params.special_id, params.childrenid, params.id);
	const hash = firstValue(params.hash, params.schash, params.extdata);

	return commentRequestConfig(params, {
		r: "comments/getCommentWithLike",
		code: SONG_BARRAGE_CODE,
		childrenid: specialId,
		extdata: specialId ? undefined : hash,
		childrenname: firstValue(
			params.name,
			params.song_name,
			params.childrenname,
		),
		mixsongid: firstValue(params.mixsongid, params.album_audio_id),
		p: firstValue(params.page, params.p, 1),
		pagesize: firstValue(params.pagesize, 20),
		...getListAuthParams(params),
	});
};

export const buildVideoBarrageListConfig = (
	params: Record<string, any> = {},
): KgRequestOptions => {
	const videoId = firstValue(params.video_id, params.childrenid, params.id);
	const hash = firstValue(params.hash, params.mvhash, params.extdata);

	return commentRequestConfig(params, {
		r: "comments/getCommentWithLike",
		code: VIDEO_BARRAGE_CODE,
		childrenid: videoId,
		extdata: videoId ? undefined : hash,
		childrenname: firstValue(
			params.name,
			params.video_name,
			params.childrenname,
		),
		p: firstValue(params.page, params.p, 1),
		pagesize: firstValue(params.pagesize, 20),
		...getListAuthParams(params),
	});
};

export const buildCommentSendConfig = (
	params: Record<string, any> = {},
	code: string,
): KgRequestOptions => {
	const { clienttime, mid, token, userid, dfid, uuid } = getIdentity(params);
	const contentData = compact({
		content: params.content,
		album_audio_id: firstValue(params.mixsongid, params.album_audio_id),
		title: params.title,
		extdata: params.content_extdata,
		images: Array.isArray(params.images) ? params.images : [],
	});
	const data = JSON.stringify({ data: contentData });

	return commentRequestConfig(
		params,
		{
			r: "commentsv3/add",
			code,
			childrenid: firstValue(params.special_id, params.childrenid, params.id),
			childrenname: firstValue(
				params.name,
				params.song_name,
				params.album_name,
				params.playlist_name,
				params.childrenname,
			),
			kugouid: userid,
			ver: firstValue(params.ver, 6),
			clienttoken: token,
			appid,
			clientver,
			mid,
			clienttime,
			key: signParamsKey(`${clienttime}${mid}${data}`),
			uuid,
			dfid,
			source: params.source,
		},
		"POST",
		data,
	);
};

export const buildSongBarrageSendConfig = (
	params: Record<string, any> = {},
): KgRequestOptions => buildCommentSendConfig(params, SONG_BARRAGE_CODE);

export const buildCommentReplyConfig = (
	params: Record<string, any> = {},
	code: string,
): KgRequestOptions => {
	const { clienttime, mid, token, userid, dfid, uuid } = getIdentity(params);
	const pid = firstValue(params.pid, 0);
	const isTopLevelReply = firstValue(
		params.is_t,
		params.isT,
		`${pid}` === "0" ? 1 : 0,
	);
	const replyUserName = firstValue(params.reply_user_name, params.puser);
	const replyContent = firstValue(params.reply_content, params.pcontent);
	const content =
		replyUserName && replyContent && !`${params.content}`.includes("//@")
			? `${params.content}//@${replyUserName}:${replyContent}`
			: params.content;

	return commentRequestConfig(
		params,
		{
			r: "commentsv2/reply",
			code,
			childrenid: firstValue(params.special_id, params.childrenid, params.id),
			childrenname: firstValue(
				params.name,
				params.song_name,
				params.album_name,
				params.playlist_name,
				params.childrenname,
			),
			kugouid: userid,
			ver: firstValue(params.ver, 6),
			clienttoken: token,
			appid,
			clientver,
			mid,
			clienttime,
			key: signParamsKey(`${clienttime}${mid}`),
			uuid,
			dfid,
			extdata: params.extdata,
			content,
			tid: params.tid,
			is_t: isTopLevelReply,
			pid,
			source: params.source,
		},
		"POST",
	);
};

export const buildVideoBarrageSendConfig = (
	params: Record<string, any> = {},
): KgRequestOptions => {
	const { mid, token, userid } = getIdentity(params);

	return commentRequestConfig(params, {
		r: "comments/addcomment",
		code: VIDEO_BARRAGE_CODE,
		childrenid: firstValue(params.video_id, params.childrenid, params.id),
		childrenname: firstValue(
			params.name,
			params.video_name,
			params.childrenname,
		),
		ver: firstValue(params.ver, "1.02"),
		content: params.content,
		pid: params.pid,
		clientver,
		mid,
		clienttoken: token,
		kugouid: userid,
		appid,
	});
};

export const extractResolvedResource = (
	response: Record<string, any> = {},
): { id: any; name: any } => {
	const body = response.body || {};
	const first = Array.isArray(body.list) ? body.list[0] || {} : {};

	return {
		id: firstValue(body.childrenid, first.special_child_id),
		name: firstValue(first.special_child_name, first.song_show_text),
	};
};
