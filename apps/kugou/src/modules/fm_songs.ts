// Ported from KuGouMusicApi/module/fm_songs.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { appid, clientver, signParamsKey } from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dateTime = Date.now();
		const userid = params?.cookie?.userid || params?.userid;

		const fmData = (params?.fmid || "").split(",").map((s: any) => ({
			fmid: s,
			fmtype: params?.type || 2,
			offset: params?.offset || -1,
			size: params?.size || 20,
			singername: s.singername || "",
		}));

		// fmType 生成
		(params?.fmtype || "").split(",").forEach((s: any, l: any) => {
			fmData[l].fmtype = s || fmData[l].fmtype;
		});

		(params?.fmoffset || "").split(",").forEach((s: any, l: any) => {
			fmData[l].offset = s || fmData[l].offset;
		});

		(params?.fmsize || "").split(",").forEach((s: any, l: any) => {
			fmData[l].size = s || fmData[l].size;
		});

		const dataMap: Record<string, any> = {
			appid,
			area_code: 1,
			clienttime: dateTime,
			clientver,
			data: fmData,
			get_tracker: 1,
			key: signParamsKey(dateTime),
			mid: params?.cookie?.KUGOU_API_MID,
			uid: userid,
		};

		return useAxios({
			url: "/v1/app_song_list_offset",
			encryptType: "android",
			method: "POST",
			data: dataMap,
			cookie: params?.cookie || {},
			headers: {
				"x-router": "fm.service.kugou.com",
				"Content-Type": "application/json",
			},
		});
	},
);
