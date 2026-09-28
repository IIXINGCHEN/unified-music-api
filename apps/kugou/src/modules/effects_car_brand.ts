// Ported from KuGouMusicApi/module/effects_car_brand.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 音效 - 汽车列表

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			baseURL: "http://mobilecdngz.kugou.com",
			url: "/api/v5/car_sound/get_brand",
			method: "GET",
			encryptType: "android",
			clearDefaultParams: true,
			cookie: params?.cookie || {},
		});
	},
);
