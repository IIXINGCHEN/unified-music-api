// Ported from KuGouMusicApi/module/user_cloud_del.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	appid,
	clientver,
	playlistAesDecrypt,
	playlistAesEncrypt,
	rsaEncrypt2,
	signParamsKey,
} from "@music-api/kugou-crypto";

// 删除用户云盘音乐

const splitList = (value: any) =>
	[]
		.concat(value || [])
		.flatMap((item: any) => {
			if (Array.isArray(item)) return item;
			const text = String(item).trim();
			if (!text) return [];
			if (text.startsWith("[") && text.endsWith("]")) {
				try {
					const parsed = JSON.parse(text);
					if (Array.isArray(parsed)) return parsed;
				} catch (e: any) {}
			}
			return text.split(",");
		})
		.map((item: any) => String(item).trim())
		.filter(Boolean);

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const answer: Record<string, any> = { status: 500, body: {}, cookie: [] };
		return new Promise<any>((resolve: any) => {
			void (async () => {
				try {
					const userid = String(params?.userid || params?.cookie?.userid || 0);
					const token = params?.token || params?.cookie?.token || "";
					const mid = params?.cookie?.KUGOU_API_MID;
					const requestAppid = params?.appid || appid;
					const requestClientver = params?.clientver || clientver;
					const clienttime = Math.floor(Date.now() / 1000);

					const fileids = splitList(
						params?.fileids ||
							params?.fileid ||
							params?.kv_ids ||
							params?.kv_id,
					);
					const albumAudioIds = splitList(
						params?.album_audio_ids || params?.album_audio_id,
					);

					if (!fileids.length) {
						throw new Error("请传入 fileid 或 kv_id");
					}

					const dataMap: Record<string, any> = {
						data: fileids.map((id: any, index: any) => ({
							kv_id: Number(id) || id,
							album_audio_id: Number(
								albumAudioIds[index] ||
									albumAudioIds[0] ||
									params?.mixid ||
									params?.mix_id ||
									0,
							),
						})),
					};

					const aesEncrypt = playlistAesEncrypt(dataMap);
					const p = rsaEncrypt2({
						aes: aesEncrypt.key,
						uid: userid,
						token,
					}).toUpperCase();

					const respone: any = await useAxios({
						baseURL: "https://mcloudservice.kugou.com",
						url: "/v1/del_files",
						params: {
							clienttime,
							mid,
							key: signParamsKey(
								clienttime.toString(),
								requestAppid,
								requestClientver,
							),
							clientver: requestClientver,
							appid: requestAppid,
							p,
						},
						data: Buffer.from(aesEncrypt.str, "base64"),
						method: "post",
						encryptType: "android",
						responseType: "arraybuffer",
						cookie: params?.cookie || {},
						clearDefaultParams: true,
						notSignature: true,
					});

					try {
						respone.body = playlistAesDecrypt({
							str: respone.body.toString("base64"),
							key: aesEncrypt.key,
						});
					} catch (e: any) {
						try {
							respone.body = JSON.parse(respone.body.toString());
						} catch (e2: any) {
							respone.body = respone.body.toString();
						}
					}

					resolve(respone);
				} catch (error: any) {
					console.log(error);
					let upstream = error?.body?.msg?.response?.data;
					if (upstream && Buffer.isBuffer(upstream))
						upstream = upstream.toString();
					answer.body = {
						status: 0,
						msg: upstream
							? typeof upstream === "string"
								? upstream
								: JSON.stringify(upstream)
							: error?.body?.msg?.message || error?.message || String(error),
					};
					resolve(answer);
				}
			})();
		});
	},
);
