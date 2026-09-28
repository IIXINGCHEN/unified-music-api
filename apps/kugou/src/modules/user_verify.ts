// Ported from KuGouMusicApi/module/user_verify.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return new Promise<any>((resolve: any, reject: any) => {
			useAxios({
				baseURL: "http://trackercdngz.kugou.com",
				url: "/v1/user_verify",
				method: "GET",
				params: { module_id: 51 },
				encryptType: "android",
				cookie: Object.assign({}, params?.cookie),
			})
				.then((res: any) => {
					const body = res.body;
					if (body?.status === 1 && body?.data && body?.data?.auth) {
						res.cookie.push(`auth=${body?.data?.auth}`);
					}

					resolve(res);
				})
				.catch(reject);
		});
	},
);
