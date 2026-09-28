// Ported from KuGouMusicApi/module/playlist_del.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	appid,
	clientver,
	playlistAesDecrypt,
	playlistAesEncrypt,
	rsaEncrypt2,
	signParamsKey,
} from "@music-api/kugou-crypto";

// 取消收藏歌单
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const answer: Record<string, any> = { status: 500, body: {}, cookie: [] };
		return new Promise<any>((resolve: any) => {
			void (async () => {
				try {
					const userid = params?.userid || params?.cookie?.userid || 0;
					const token = params?.token || params.cookie?.token || "";
					const clienttime = Math.floor(Date.now() / 1000);

					const dataMap: Record<string, any> = {
						listid: Number(params.listid),
						total_ver: 0,
						type: 1,
					};

					const aesEncrypt = playlistAesEncrypt(dataMap);

					const p = rsaEncrypt2({
						aes: aesEncrypt.key,
						uid: userid,
						token,
					}).toUpperCase();

					const paramsMap: Record<string, any> = {
						clienttime,
						key: signParamsKey(clienttime.toString()),
						last_area: "gztx",
						clientver,
						appid,
						last_time: clienttime,
						p,
					};

					const respone: any = await useAxios({
						url: "/v2/delete_list",
						params: paramsMap,
						data: aesEncrypt.str,
						method: "post",
						encryptType: "android",
						headers: { "x-router": "cloudlist.service.kugou.com" },
						responseType: "arraybuffer",
						cookie: params?.cookie || {},
					});

					respone.body = playlistAesDecrypt({
						str: respone.body.toString("base64"),
						key: aesEncrypt.key,
					});

					resolve(respone);
				} catch (error: any) {
					console.log(error);
					answer.body = error;
					resolve(answer);
				}
			})();
		});
	},
);
