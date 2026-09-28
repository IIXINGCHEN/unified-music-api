// Ported from KuGouMusicApi/module/scene_module.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/scene/v1/scene/module",
			params: { scene_id: params.id },
			method: "POST",
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
