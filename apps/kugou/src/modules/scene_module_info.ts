// Ported from KuGouMusicApi/module/scene_module_info.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/scene/v1/scene/module_info",
			params: { scene_id: params.id, module_id: params.module_id },
			method: "GET",
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
