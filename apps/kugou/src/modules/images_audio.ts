// Ported from KuGouMusicApi/module/images_audio.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	appid,
	clientver,
	signatureAndroidParams,
} from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const data = (params?.hash || "").split(",").map((s: any) => ({
			audio_id: 0,
			hash: s,
			album_audio_id: 0,
			filename: "",
		}));
		(params?.audio_id || "").split(",").forEach((s: any, index: any) => {
			if (index <= data.length - 1) {
				data[index]["audio_id"] = s || 0;
			}
		});
		(params?.album_audio_id || "").split(",").forEach((s: any, index: any) => {
			if (index <= data.length - 1) {
				data[index]["album_audio_id"] = s || 0;
			}
		});
		(params?.filename || "").split(",").forEach((s: any, index: any) => {
			if (index <= data.length - 1) {
				data[index]["filename"] = s;
			}
		});

		const paramsMap: Record<string, any> = {
			appid,
			clientver,
			count: params?.count || 5,
			data,
			isCdn: 1,
			publish_time: 1,
			show_authors: 1,
		};

		const query = Object.keys(paramsMap)
			.sort()
			.map(
				(s: any) =>
					`${s}=${encodeURIComponent(typeof paramsMap[s] === "object" ? JSON.stringify(paramsMap[s]) : paramsMap[s])}`,
			);

		const signature = signatureAndroidParams(paramsMap);

		return useAxios({
			baseURL: "https://expendablekmr.kugou.com",
			url: `/v2/author_image/audio?${query.join("&")}`,
			method: "GET",
			encryptType: "android",
			params: { signature },
			cookie: params?.cookie || {},
			clearDefaultParams: true,
		});
	},
);
