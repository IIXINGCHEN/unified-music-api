// Ported from KuGouMusicApi/module/ip_zone.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// ip 专区
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return new Promise<any>((resolve: any, reject: any) => {
			useAxios({
				url: `/v1/zone/index`,
				encryptType: "android",
				method: "GET",
				cookie: params?.cookie || {},
				headers: { "x-router": "yuekucategory.kugou.com" },
			})
				.then((resp: any) => {
					// biome-ignore lint/suspicious/noDoubleEquals: 原版语义，status 可能为字符串，保留 ==
					if (resp.body.status == 1) {
						if (resp.body.data?.list) {
							const list = Array.isArray(resp.body.data.list)
								? resp.body.data?.list
								: [];
							for (let index = 0; index < list.length; index += 1) {
								if (list[index].special_link) {
									const urls = new URLSearchParams(list[index].special_link);
									if (urls.has("path")) {
										const pathUrls = new URLSearchParams(
											urls.get("path") || "",
										);
										list[index]["ip_id"] = Number(pathUrls.get("ip_id") || "");
									}
								}
							}
							resp.body.data.list = list;
						}
					}
					resolve(resp);
				})
				.catch((e: any) => reject(e));
		});
	},
);
