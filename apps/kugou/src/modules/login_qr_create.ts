// Ported from KuGouMusicApi/module/login_qr_create.js — behavior identical to the original.
// 酷狗二维码生成（qrcode 依赖由父流程统一安装）。

import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import qrcode from "qrcode";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return new Promise<any>((resolve: any) => {
			void (async () => {
				const url = `https://h5.kugou.com/apps/loginQRCode/html/index.html?qrcode=${params.key}`;
				return resolve({
					code: 200,
					status: 200,
					body: {
						code: 200,
						data: {
							url: url,
							base64: params?.qrimg ? await qrcode.toDataURL(url) : "",
						},
					},
				});
			})();
		});
	},
);
