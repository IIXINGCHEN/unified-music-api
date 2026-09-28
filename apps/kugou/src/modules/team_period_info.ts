// Ported from KuGouMusicApi/module/team_period_info.js — behavior identical to the original.

import crypto from "node:crypto";
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	appid,
	clientver,
	publicLiteRasKey,
	signatureWebParams,
	srcappid,
} from "@music-api/kugou-crypto";

//获取本期活动状态

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
		const dataMap: Record<string, any> = {
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

		const signature = signatureWebParams(dataMap);
		const finalParams: Record<string, any> = { ...dataMap, signature };

		return useAxios({
			url: "/youth/v1/ut/get_period_info",
			method: "GET",
			params: finalParams,
			cookie: params?.cookie || {},
			headers: { Host: "gateway.kugou.com" },
		});
	},
);
