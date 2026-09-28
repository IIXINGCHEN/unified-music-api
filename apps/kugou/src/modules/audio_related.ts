// Ported from KuGouMusicApi/module/audio_related.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { cryptoMd5 } from "@music-api/kugou-crypto";

const sortType: Record<string, any> = { all: 1, hot: 2, new: 3 };

// https://listkmrp3cdnretry.kugou.com/v3/album_audio/related
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const show_detail = Number(params.show_detail) === 0;

		let dataMap: Record<string, any> = {
			album_audio_id: Number(params.album_audio_id),
			appid: 1005,
			area_code: 1,
			clientver: 12329,
		};

		if (!show_detail) {
			dataMap = {
				...dataMap,
				page: params.page || 1,
				pagesize: params.pagesize || 30,
				show_input: 1,
				show_type: params.show_type || 0,
				sort: sortType[params.sort] || 1,
				type: params.type || 0,
			};
		}

		dataMap["version"] = 1;

		const str = "OIlwieks28dk2k092lksi2UIkp";
		const paramsString = Object.keys(dataMap)
			.sort()
			.map(
				(key: any) =>
					`${key}=${typeof dataMap[key] === "object" ? JSON.stringify(dataMap[key]) : dataMap[key]}`,
			)
			.join("");
		dataMap["signature"] = cryptoMd5(`${str}${paramsString}${str}`);

		return useAxios({
			baseURL: "https://listkmrp3cdnretry.kugou.com",
			url: !show_detail ? "/v3/album_audio/related" : "/v2/audio_related/total",
			params: dataMap,
			method: "get",
			encryptType: "android",
			cookie: params?.cookie || {},
			clearDefaultParams: true,
		});
	},
);
