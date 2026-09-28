// Ported from KuGouMusicApi/module/login_cellphone.js — behavior identical to the original.
import {
	defineKgModule,
	isLitePlatform,
	type KgRequestFn,
} from "@music-api/kugou-core";
import {
	cryptoAesDecrypt,
	cryptoAesEncrypt,
	cryptoRSAEncrypt,
	randomString,
	signParamsKey,
} from "@music-api/kugou-crypto";

// 手机登录

const liteT2Key = "fd14b35e3f81af3817a20ae7adae7020";
const liteT2Iv = "17a20ae7adae7020";
const liteT1Key = "5e4ef500e9597fe004bd09a46d8add98";
const liteT1Iv = "04bd09a46d8add98";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dateTime = Date.now();
		const encrypt = cryptoAesEncrypt({
			mobile: params?.mobile || "",
			code: params?.code || "",
		});
		const mobile =
			params?.mobile &&
			`${params.mobile.toString().substring(0, 2)}*****${params.mobile.toString().substring(10, 11)}`;
		const dfid = params?.cookie?.dfid ?? randomString(24);
		const t2 = cryptoAesEncrypt(
			`${params.cookie?.KUGOU_API_GUID}|0f607264fc6318a92b9e13c65db7cd3c|${params.cookie?.KUGOU_API_MAC}|${params.cookie?.KUGOU_API_DEV}|${dateTime}`,
			{ key: liteT2Key, iv: liteT2Iv },
		);
		const t1 = cryptoAesEncrypt(`|${dateTime}`, {
			key: liteT1Key,
			iv: liteT1Iv,
		});
		const dataMap: Record<string, any> = {
			plat: 1,
			support_multi: 1,
			t1: isLitePlatform() ? t1 : 0,
			t2: isLitePlatform() ? t2 : 0,
			clienttime_ms: dateTime,
			mobile,
			key: signParamsKey(dateTime),
			pk: cryptoRSAEncrypt({
				clienttime_ms: dateTime,
				key: encrypt.key,
			}).toUpperCase(),
			params: encrypt.str,
		};

		if (params?.userid) dataMap["userid"] = params.userid;

		if (isLitePlatform()) {
			dataMap["dfid"] = dfid;
			dataMap["dev"] = params.cookie?.KUGOU_API_DEV;
			dataMap["gitversion"] = "5f0b7c4";
		} else {
			dataMap["t3"] = "MCwwLDAsMCwwLDAsMCwwLDA=";
		}

		return new Promise<any>((resolve: any, reject: any) => {
			useAxios({
				baseURL: "https://loginserviceretry.kugou.com",
				url: `/v7/login_by_verifycode`,
				method: "POST",
				data: dataMap,
				encryptType: "android",
				headers: {
					"support-calm": "1",
					"User-Agent": "Android16-1070-11440-130-0-LOGIN-wifi",
				},
				cookie: params?.cookie || {},
			})
				.then((res: any) => {
					const { body } = res;
					if (body?.status && body?.status === 1) {
						if (body?.data?.secu_params) {
							const getToken = cryptoAesDecrypt(
								body.data.secu_params,
								encrypt.key,
							);
							if (typeof getToken === "object") {
								res.body.data = { ...body.data, ...getToken };
								Object.keys(getToken).forEach((key: any) => {
									res.cookie.push(`${key}=${getToken[key]}`);
								});
							} else {
								res.body.data["token"] = getToken;
							}
						}
						res.cookie.push(`t1=${res.body.data["t1"]}`);
						res.cookie.push(`token=${res.body.data["token"]}`);
						res.cookie.push(`userid=${res.body.data?.userid || 0}`);
						res.cookie.push(`vip_type=${res.body.data?.vip_type || 0}`);
						res.cookie.push(`vip_token=${res.body.data?.vip_token || ""}`);
					}
					resolve(res);
				})
				.catch((e: any) => reject(e));
		});
	},
);
