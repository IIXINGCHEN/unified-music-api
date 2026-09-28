// Ported from KuGouMusicApi/module/verify_user_info.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { cryptoAesEncrypt, cryptoRSAEncrypt } from "@music-api/kugou-crypto";

// 验证验证码数据
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const clienttime = Date.now();
		const v_type = Number(params?.v_type || 23);
		const userid = Number(params?.userid || params?.cookie?.userid || "0");
		//
		let dataMap: Record<string, any> = {
			eventid: params?.eventid,
			userid,
			platid: params?.platid || 2,
			v_type,
			wasm: 1,
			i: "",
			sid: decodeURIComponent(params?.sid || ""),
			edt: decodeURIComponent(params?.edt || ""),
		};

		if (v_type === 23) {
			const encrypt = cryptoAesEncrypt({});
			dataMap = {
				...dataMap,
				verifycode: decodeURIComponent(params?.verifycode || ""),
				pk: cryptoRSAEncrypt({ key: encrypt.key }),
				params: encrypt.str,
			};
		}

		if (v_type === 32) {
			const encrypt = cryptoAesEncrypt({ code: params?.verifycode || "" });
			dataMap = {
				...dataMap,
				code: decodeURIComponent(params?.verifycode || ""),
				pk: cryptoRSAEncrypt({ key: encrypt.key }),
				params: encrypt.str,
			};
		}

		return useAxios({
			baseURL: "https://verifyservice.kugou.com",
			url: "/v4/verify_user_info",
			encryptType: "android",
			method: "POST",
			data: dataMap,
			params: { clientver: 11510 },
			cookie: params?.cookie || {},
		});
	},
);
