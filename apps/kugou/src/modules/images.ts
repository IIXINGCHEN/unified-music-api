// Ported from KuGouMusicApi/module/images.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	appid,
	clientver,
	signatureAndroidParams,
} from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const data = (params?.hash || "")
			.split(",")
			.map((s: any) => ({ album_id: 0, hash: s, album_audio_id: 0 }));
		(params?.album_id || "").split(",").forEach((s: any, index: any) => {
			if (index <= data.length - 1) {
				data[index]["album_id"] = s || 0;
			}
		});
		(params?.album_audio_id || "").split(",").forEach((s: any, index: any) => {
			if (index <= data.length - 1) {
				data[index]["album_audio_id"] = s || 0;
			}
		});

		const paramsMap: Record<string, any> = {
			album_image_type: "-3",
			appid,
			clientver,
			author_image_type: "3,4,5",
			count: params?.count || 5,
			data,
			isCdn: 1,
			publish_time: 1,
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
			url: `/container/v2/image?${query.join("&")}`,
			method: "GET",
			encryptType: "android",
			params: { signature },
			cookie: params?.cookie || {},
			clearDefaultParams: true,
		});
	},
);
