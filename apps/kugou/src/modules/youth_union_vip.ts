// Ported from KuGouMusicApi/module/youth_union_vip.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 领取vip 需要登录
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			busi_type: "concept",
			opt_product_types: "dvip,qvip",
			product_type: "svip",
		};

		return useAxios({
			baseURL: "https://kugouvip.kugou.com",
			url: "/v1/get_union_vip",
			encryptType: "android",
			method: "get",
			params: paramsMap,
			cookie: params?.cookie,
		});
	},
);
