// Ported from KuGouMusicApi/module/scene_collection_list.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { appid, clientver } from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const userid = params?.userid || params?.cookie?.userid || 0;
		const token = params?.token || params.cookie?.token || "";

		const dataMap: Record<string, any> = {
			appid,
			clientver,
			token,
			userid,
			tag_id: params.tag_id,
			page: params.page || 1,
			page_size: params.pagesize || 30,
			exposed_data: [],
		};

		return useAxios({
			url: "/scene/v1/distribution/collection_list",
			method: "POST",
			encryptType: "android",
			data: dataMap,
			cookie: params?.cookie || {},
		});
	},
);
