// Ported from KuGouMusicApi/module/album.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	appid,
	clientver,
	cryptoMd5,
	signParamsKey,
} from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dateTime = Date.now();
		const data = (params?.album_id || "")
			.split(",")
			.map((s: any) => ({ album_id: s, album_name: "", author_name: "" }));
		const dfid = params?.cookie?.dfid || params?.dfid || "-";
		const userid = params?.cookie?.userid || params?.userid || 0;
		const token = params?.cookie?.token || params?.token || 0;

		const dataMap: Record<string, any> = {
			appid,
			clienttime: dateTime,
			clientver,
			data,
			dfid,
			fields: params?.fields || "",
			key: signParamsKey(dateTime),
			mid: params?.cookie?.KUGOU_API_MID,
		};

		if (token) dataMap["token"] = token;
		if (userid) dataMap["userid"] = userid;

		return useAxios({
			baseURL: "http://kmr.service.kugou.com",
			url: "/v1/album",
			method: "POST",
			data: dataMap,
			encryptType: "android",
			cookie: params?.cookie || {},
			headers: {
				"x-router": "kmr.service.kugou.com",
				"Content-Type": "application/json",
			},
		});
	},
);
