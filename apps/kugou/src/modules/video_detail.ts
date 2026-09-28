// Ported from KuGouMusicApi/module/video_detail.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	appid,
	clientver,
	cryptoMd5,
	signParamsKey,
} from "@music-api/kugou-crypto";

// 获取视频详情
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dfid = params?.cookie?.dfid || "-"; // 自定义
		const mid = params?.cookie?.KUGOU_API_MID; // 可以自定义
		const uuid = cryptoMd5(`${dfid}${mid}`); // 可以自定义
		const token = params?.token || params?.cookie?.token || "";
		const clienttime = Math.floor(new Date().getTime() / 1000);

		const resource = (params.id || "")
			.split(",")
			.map((s: any) => ({ video_id: s }));

		const dataMap: Record<string, any> = {
			appid,
			clientver,
			clienttime,
			mid,
			uuid,
			dfid,
			token: token || "",
			key: signParamsKey(clienttime.toString()),
			show_resolution: 1,
			data: resource,
		};
		return useAxios({
			url: "/v1/video",
			method: "POST",
			data: dataMap,
			encryptType: "android",
			cookie: params?.cookie || {},
			clearDefaultParams: true,
			headers: { "x-router": "kmr.service.kugou.com" },
		});
	},
);
