// Ported from KuGouMusicApi/module/scene_lists.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/scene/v1/scene/list",
			method: "GET",
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
