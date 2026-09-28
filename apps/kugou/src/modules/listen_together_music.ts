// Ported from KuGouMusicApi/module/listen_together_music.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	authBody,
	createDomainHandler,
	GATEWAY_BASE,
	MUSIC_ROOM_BIZ,
	musicRoomAudios,
	parseArray,
	parseObject,
} from "./_listen_together_common.js";

export default createDomainHandler({
	history: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/genting/history",
		method: "GET",
		params: (p: any) => ({ last_id: Number(p.last_id || 0) }),
	},
	list: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v2/genting/recommend",
		method: "POST",
		params: (p: any) => ({
			page: Math.max(0, Number(p.page || 1) - 1),
			pagesize: Number(p.pagesize || 20),
			loop_pick: Number(p.loop_pick || 0),
			tags: p.tags || "",
			room_biz: MUSIC_ROOM_BIZ,
			...(p.mixsongid ? { mixsongid: p.mixsongid } : {}),
		}),
		data: (p: any) => ({ data: parseArray(p.behaviors) }),
	},
	detail: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/genting/get_musicroom_info",
		method: "GET",
		params: (p: any) => ({
			roomid: p.roomid || p.room_id || "",
			biz: p.biz || MUSIC_ROOM_BIZ,
		}),
	},
	members: {
		baseURL: GATEWAY_BASE,
		// 概念版房间成员弹窗使用的是众乐房听众列表；rmservice/members
		// 返回的是连麦席位，普通进入房间的听众不会出现在其中。
		url: "/youth/v1/genting/get_musicroom_member",
		method: "GET",
		params: (p: any) => ({
			roomid: p.roomid || p.room_id || "",
			page: Math.max(1, Number(p.page || 1)),
			pagesize: Number(p.pagesize || 100),
			apiver: "3",
		}),
	},
	initialize: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/genting/init_musicroom",
		method: "POST",
		params: (p: any) => ({ roomid: p.roomid || p.room_id || "" }),
		data: (p: any) => {
			const body: Record<string, any> = {
				sendall: Number(p.sendall ?? 1),
				audios: musicRoomAudios(p),
			};
			const progressInfo = parseObject(p.progress_info, null);
			if (progressInfo) body.progress_info = progressInfo;
			return body;
		},
	},
	sync_player: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/genting/music_sync_player",
		method: "POST",
		params: (p: any) => ({
			roomid: p.roomid || p.room_id || "",
			frm: Number(p.frm || 2),
		}),
		data: () => ({}),
	},
	playback_url: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/genting/music_reqcmd",
		method: "POST",
		// 概念版从房间播放页请求 genting 授权地址时会携带固定页面链路。
		// gateway 会据此路由 music_reqcmd；缺失时上游直接返回 404。
		params: () => ({ page_id: 147780134, ppage_id: "356753938" }),
		data: (p: any) => ({
			...authBody(p),
			roomid: p.roomid || p.room_id || "",
			audio: {
				hash: p.hash || "",
				mixsongid: p.mixsongid ?? "",
			},
		}),
	},
	switch_song: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/genting/music_sw",
		method: "POST",
		params: (p: any) => ({ roomid: p.roomid || p.room_id || "" }),
		data: (p: any) => ({
			act_type: Number(p.act_type || 1),
			list_version: String(p.list_version || ""),
			is_auto: Number(p.is_auto || 0) ? "1" : "0",
			audio: {
				hash: p.hash || "",
				mixsongid: p.mixsongid ?? "",
			},
		}),
	},
	player_operation: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/genting/music_player_opr",
		method: "POST",
		params: (p: any) => ({ roomid: p.roomid || p.room_id || "" }),
		data: (p: any) => {
			const action = Number(p.action || 3);
			const body: Record<string, any> = { action };
			if (action === 1) body.play_mode = Number(p.play_mode || 1);
			if (action === 2)
				body.progress = Math.max(0, Math.floor(Number(p.progress || 0)));
			if (action === 3) body.pause = Number(p.pause || 2) === 1 ? "1" : "2";
			return body;
		},
	},
	playlist: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/genting/music_fetch_list",
		method: "POST",
		params: (p: any) => ({ roomid: p.roomid || p.room_id || "" }),
		data: (p: any) => {
			const body: Record<string, any> = { pagesize: Number(p.pagesize || 50) };
			const audio = parseObject(p.audio, null);
			if (audio?.hash) {
				body.audio = {
					hash: audio.hash,
					mixsongid: audio.mixsongid ?? audio.mixSongId ?? "",
				};
			}
			return body;
		},
	},
	recent_playlist: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/genting/music_recent_list",
		method: "POST",
		params: (p: any) => ({ roomid: p.roomid || p.room_id || "" }),
		// 概念版为这个接口签名并发送空请求体，不是 JSON 对象。
		data: () => "",
	},
	order_song: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/genting/order_song",
		method: "POST",
		params: (p: any) => ({ roomid: p.roomid || p.room_id || "" }),
		data: (p: any) => ({ mixsongid: p.mixsongid ?? "", hash: p.hash || "" }),
	},
	song_order_list: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/genting/song_order_list",
		method: "GET",
		params: (p: any) => ({ roomid: p.roomid || p.room_id || "" }),
	},
	remove_song: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/genting/remove_song",
		method: "POST",
		params: (p: any) => ({ roomid: p.roomid || p.room_id || "" }),
		data: (p: any) => ({
			mixsongid: p.mixsongid ?? "",
			hash: p.hash || "",
			order_userid: String(p.order_userid || ""),
		}),
	},
	music_add: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/genting/music_add",
		method: "POST",
		params: (p: any) => ({
			roomid: p.roomid || p.room_id || "",
			...(p.order_userid
				? {
						order_userid: String(p.order_userid),
						source: String(p.source || 1),
					}
				: {}),
		}),
		data: (p: any) => {
			const body: Record<string, any> = {
				action: Number(p.action || 4),
				list_version: String(p.list_version || ""),
				sendall: Number(p.sendall ?? 1),
				audios: musicRoomAudios(p),
			};
			const progressInfo = parseObject(p.progress_info, null);
			if (progressInfo) body.progress_info = progressInfo;
			return body;
		},
	},
});
