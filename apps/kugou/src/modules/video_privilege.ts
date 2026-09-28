// Ported from KuGouMusicApi/module/video_privilege.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	appid,
	clientver,
	cryptoMd5,
	signParamsKey,
} from "@music-api/kugou-crypto";

// 获取视频特权

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dfid = params?.cookie?.dfid || "-";
		const mid = params?.cookie?.KUGOU_API_MID;

		const resource = (params?.hash || "")
			.split(",")
			.map((s: any) => ({ hash: s, id: 0, name: "" }));

		const dataMap: Record<string, any> = {
			appid,
			area_code: 1,
			behavior: "play",
			clientver,
			dfid,
			mid,
			resource,
			token: params?.cookie?.token || "",
			userid: params?.cookie?.userid || 0,
			vip: params?.cookie?.vip_type || 0,
		};

		return useAxios({
			url: "/v1/get_video_privilege",
			method: "POST",
			data: dataMap,
			encryptType: "android",
			cookie: params?.cookie || {},
			headers: { "x-router": "media.store.kugou.com" },
		});
	},
);
