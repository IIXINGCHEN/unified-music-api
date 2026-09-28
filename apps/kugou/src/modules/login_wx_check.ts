// Ported from KuGouMusicApi/module/login_wx_check.js — behavior identical to the original.
// 原版用裸 axios 直调微信扫码状态接口（不走代理）；此处用 fetch 等价实现。
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const answer: Record<string, any> = { status: 500, body: {}, cookie: [] };
		return new Promise<any>((resolve: any, reject: any) => {
			void (async () => {
				try {
					const resp = await fetch(
						`https://long.open.weixin.qq.com/connect/l/qrconnect?f=json&uuid=${params?.uuid || ""}`,
					);
					const text = await resp.text();
					if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text}`);

					answer.status = 200;
					try {
						answer.body = JSON.parse(text);
					} catch {
						answer.body = text;
					}

					resolve(answer);
				} catch (err: any) {
					answer.status = 502;
					answer.body = { status: 0, msg: err };
					reject(answer);
				}
			})();
		});
	},
);
