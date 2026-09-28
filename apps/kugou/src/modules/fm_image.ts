// Ported from KuGouMusicApi/module/fm_image.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { appid, clientver, signParamsKey } from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dateTime = Date.now();
		const dfid = params?.cookie?.dfid || params?.dfid || "-";
		const userid = params?.cookie?.userid || params?.userid;
		const token = params?.cookie?.token || params?.token;

		const fmData = (params?.fmid || "")
			.split(",")
			.map((s: any) => ({ fields: "imgUrl100,imgUrl50", fmid: s, fmtype: 2 }));

		const dataMap: Record<string, any> = {
			appid,
			clienttime: dateTime,
			clientver,
			data: fmData,
			dfid,
			key: signParamsKey(dateTime),
			mid: params?.cookie?.KUGOU_API_MID,
		};
		if (userid) dataMap["userid"] = userid;
		if (token) dataMap["token"] = token;

		return useAxios({
			url: "/v1/fm_info",
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
