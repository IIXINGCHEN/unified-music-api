// Ported from KuGouMusicApi/module/lyric.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { decodeLyrics } from "@music-api/kugou-crypto";
// 歌词获取

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			ver: 1,
			client: params?.client || "android",
			id: params?.id,
			accesskey: params?.accesskey,
			fmt: params.fmt || "krc",
			charset: "utf8",
		};

		return new Promise<any>((resolve: any, reject: any) => {
			useAxios({
				baseURL: "https://lyrics.kugou.com",
				url: "/download",
				method: "GET",
				params: dataMap,
				cookie: params?.cookie || {},
				encryptType: "android",
			})
				.then((res: any) => {
					if (params?.decode) {
						if (res.body?.content) {
							res.body["decodeContent"] =
								// biome-ignore lint/suspicious/noDoubleEquals: 原版语义保留
								params?.fmt == "lrc" || Number(res.body?.contenttype) !== 0
									? Buffer.from(res.body?.content, "base64").toString()
									: decodeLyrics(res.body.content);
							resolve(res);
							return;
						}
					}
					resolve(res);
				})
				.catch((e: any) => reject(e));
		});
	},
);
