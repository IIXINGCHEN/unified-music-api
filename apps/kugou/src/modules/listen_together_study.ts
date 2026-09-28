// Ported from KuGouMusicApi/module/listen_together_study.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	authBody,
	createDomainHandler,
	GATEWAY_BASE,
	parseArray,
	YOUTH_BASE,
} from "./_listen_together_common.js";

const PAGE_ID = 711586122;
const PARENT_PAGE_ID = "356753938";

export default createDomainHandler({
	created_rooms: {
		baseURL: YOUTH_BASE,
		url: "/v1/study/user_create_room_list",
		method: "GET",
		params: () => ({}),
	},
	delete_created_room: {
		baseURL: GATEWAY_BASE,
		url: "/youth/v1/room/delete_room",
		method: "DELETE",
		params: (p: any) => ({
			global_collection_id: p.global_collection_id || p.channel_id || "",
			roomid: p.roomid || p.room_id || "",
		}),
	},
	list: {
		baseURL: YOUTH_BASE,
		url: "/v1/room/get_room_list_by_tag",
		method: "GET",
		params: (p: any) => ({
			page: p.page || 1,
			pagesize: p.pagesize || 20,
			sort: p.sort || 0,
			page_id: p.page_id || 191708212,
			ppage_id: p.ppage_id || PARENT_PAGE_ID,
			tag_id: p.tag_id || "",
		}),
	},
	detail: {
		baseURL: YOUTH_BASE,
		url: "/v1/room/get_room_detail",
		method: "GET",
		params: (p: any) => ({ room_id: p.room_id || "" }),
	},
	members: {
		baseURL: YOUTH_BASE,
		url: "/v1/room/get_member_list",
		method: "GET",
		params: (p: any) => ({
			room_id: p.room_id || "",
			page: p.page || 1,
			pagesize: p.pagesize || 20,
			member_type: Number(p.member_type ?? 1),
		}),
	},
	configure: {
		baseURL: YOUTH_BASE,
		url: "/v1/user/make_room",
		method: "POST",
		params: (p: any) => {
			const pageIds: Record<string, any> = {
				1: PAGE_ID,
				2: 971343961,
				3: 711357575,
			};
			return {
				page_id: p.page_id || pageIds[p.music_type] || PAGE_ID,
				ppage_id: p.ppage_id || PARENT_PAGE_ID,
				type: p.type ?? 1,
			};
		},
		data: (p: any) => {
			const body: Record<string, any> = {
				room_id: p.room_id || "",
				room_name: p.room_name || "",
				global_collection_id: p.global_collection_id || "",
				room_notice: p.room_notice || "",
				allow_chat: p.allow_chat ?? 1,
				room_tag: p.room_tag || "2",
				music_type: Number(p.music_type || 1),
			};
			if (body.music_type === 1 || body.music_type === 2) {
				if (p.music_style) body.music_style = p.music_style;
				const audios = parseArray(p.audios);
				if (audios.length) body.audios = audios;
			} else if (body.music_type === 3) {
				body.white_noise_type = p.white_noise_type || 1;
			}
			return body;
		},
	},
	sync_player: {
		baseURL: YOUTH_BASE,
		url: "/v1/music/sync_player",
		method: "POST",
		params: (p: any) => ({
			page_id: p.page_id || PAGE_ID,
			ppage_id: p.ppage_id || PARENT_PAGE_ID,
		}),
		data: (p: any) => ({
			roomid: p.roomid || p.room_id || "",
			frm: p.frm || 2,
			...authBody(p),
		}),
	},
	playlist: {
		baseURL: YOUTH_BASE,
		url: "/v1/music/fetch_list",
		method: "POST",
		params: (p: any) => ({
			page_id: p.page_id || PAGE_ID,
			ppage_id: p.ppage_id || PARENT_PAGE_ID,
		}),
		data: (p: any) => ({
			roomid: p.roomid || p.room_id || "",
			frm: p.frm || 2,
			pagesize: p.pagesize || 50,
			...authBody(p),
		}),
	},
});
