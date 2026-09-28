// Ported from KuGouMusicApi/module/top_ip.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
/**
 *
 * @param {Record<string, any>} params
 * @param {useAxios} useAxios
 * @returns
 */
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = { tags: {} };
		return new Promise<any>((resolve: any, reject: any) => {
			useAxios({
				baseURL: "http://musicadservice.kugou.com",
				url: "/v1/daily_recommend",
				encryptType: "android",
				method: "POST",
				data: dataMap,
				params: {
					clientver: 12349,
					area_code: 1,
				},
				cookie: params?.cookie || {},
			})
				.then((resp: any) => {
					// biome-ignore lint/suspicious/noDoubleEquals: 原版语义，status 可能为字符串，保留 ==
					if (resp.body.status == 1) {
						const list = Array.isArray(resp.body.data.list)
							? [...resp.body.data.list]
							: [];
						list.forEach((s: any, index: any) => {
							const inner_url = s?.extra?.inner_url;
							if (inner_url) {
								const findIndex = inner_url.lastIndexOf("ip_id");
								if (findIndex !== -1) {
									list[index]["extra"]["ip_id"] = Number(
										inner_url.substring(findIndex + 6),
									);
								}
							}
						});
						resp.body.data.list = list;
					}
					resolve(resp);
				})
				.catch((e: any) => reject(e));
		});
	},
);
