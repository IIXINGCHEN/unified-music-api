// Ported from KuGouMusicApi/module/playlist_pic_upload.js — behavior identical to the original.
// 上传图片（用于修改「我的歌单」自定义封面），直连图片上传服务。
// 原版用 axios；此处用 fetch/fetchViaProxy 等价实现（30s 超时、代理、octet-stream 直传均保留）。

import fs from "node:fs";
import {
	defineKgModule,
	fetchViaProxy,
	type KgRequestFn,
	resolveProxy,
} from "@music-api/kugou-core";
import { cryptoMd5 } from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return new Promise<any>((resolve: any, reject: any) => {
			const filePath = params?.file;
			if (
				!Buffer.isBuffer(params?.data) &&
				(!filePath || !fs.existsSync(filePath))
			) {
				reject({ body: { status: 0, msg: "文件不存在" } });
				return;
			}

			const image: Buffer = Buffer.isBuffer(params?.data)
				? params.data
				: fs.readFileSync(filePath);

			const date = new Date();
			const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

			const queryParams = new URLSearchParams({
				type: params?.type || "custom",
				extendName: params?.extendName || ".jpg",
				md5: params?.md5 || cryptoMd5(`${dateStr}hewry678WEK23D`),
				jsonResponse: "1",
			});

			(async () => {
				try {
					const proxyConfig = resolveProxy();
					const url = `http://imgphp.kugou.com/imageupload/stream.php?${queryParams}`;
					const headers = { "Content-Type": "application/octet-stream" };
					const request = proxyConfig
						? fetchViaProxy(
								url,
								{ method: "POST", headers, body: image },
								proxyConfig,
							)
						: fetch(url, {
								method: "POST",
								headers,
								// Buffer<ArrayBufferLike> 不兼容，此处断言（行为无差异）。
								body: image as unknown as BodyInit,
							});
					// 原版 axios timeout: 30000；fetchViaProxy 无 signal 支持，统一用 race 实现超时
					const timeout = new Promise<never>((_, reject) =>
						setTimeout(
							() => reject(new Error("timeout of 30000ms exceeded")),
							30000,
						),
					);
					const response = await Promise.race([request, timeout]);
					const text = await response.text();
					if (!response.ok) throw new Error(`HTTP ${response.status}: ${text}`);
					// 原版：axios 非 JSON 按字符串返回后再 JSON.parse，解析失败走 catch → 502
					let body: any;
					try {
						body = JSON.parse(text);
					} catch (e: any) {
						throw new Error(e?.message || "上传响应解析失败");
					}
					if (body?.IsSuccess) {
						resolve({
							status: 200,
							body: { status: 1, FileName: body.FileName },
						});
					} else {
						resolve({
							status: 502,
							body: { status: 0, msg: body?.Message || "上传失败" },
						});
					}
				} catch (err: any) {
					reject({ status: 502, body: { status: 0, msg: err.message } });
				}
			})();
		});
	},
);
