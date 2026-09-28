// Ported from KuGouMusicApi/module/team_join.js — behavior identical to the original.

import crypto from "node:crypto";
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	appid,
	clientver,
	cryptoMd5,
	publicLiteRasKey,
	srcappid,
} from "@music-api/kugou-crypto";

//加入队伍

function rsaNoPadEncrypt(data: any, publicKeyPem: any) {
	const key = crypto.createPublicKey(publicKeyPem);
	const encrypted = crypto.publicEncrypt(
		{
			key: key,
			padding: crypto.constants.RSA_NO_PADDING,
		},
		data,
	);
	return encrypted.toString("hex");
}

//带请求体签名
function signatureWebParamsWithBody(params: any, bodyStr: any) {
	const SALT = "NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt";
	const paramsString = Object.keys(params)
		.sort()
		.map((k: any) => `${k}=${params[k]}`)
		.join("");
	const input = SALT + paramsString + bodyStr + SALT;
	return cryptoMd5(input);
}

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const rawToken = params?.token || params?.cookie?.token || "";
		const userid = Number(params?.userid || params?.cookie?.userid || "0");
		const mid = params?.cookie?.KUGOU_API_MID || params?.mid || "";
		const dfid = params?.dfid || params?.cookie?.dfid || "-";
		const uuid = params?.uuid || params?.cookie?.uuid || "-";

		let token = rawToken;
		const prefix = "moc.uoguk.59::";
		const input = Buffer.from(prefix + rawToken, "utf8");
		const padded = Buffer.alloc(128);
		input.copy(padded);

		const encrypted = rsaNoPadEncrypt(padded, publicLiteRasKey).toUpperCase();
		token = "h5" + encrypted;

		const clienttime = Date.now();
		const paramsMap: Record<string, any> = {
			srcappid,
			clientver,
			clienttime,
			mid,
			uuid,
			dfid,
			appid,
			userid,
			token,
		};

		const dataMap: Record<string, any> = { team_code: params.team_code };
		//转为字符串参与签名
		const dataStr = JSON.stringify(dataMap);

		const signature = signatureWebParamsWithBody(paramsMap, dataStr);
		const finalParams: Record<string, any> = { ...paramsMap, signature };

		return useAxios({
			url: "/youth/v1/ut/join_team",
			method: "POST",
			data: dataMap,
			params: finalParams,
			cookie: params?.cookie || {},
			headers: { Host: "gateway.kugou.com" },
		});
	},
);
