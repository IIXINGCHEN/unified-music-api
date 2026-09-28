// Ported from KuGouMusicApi/module/get_verify_info.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取验证码数据
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const userid = Number(params?.userid || params?.cookie?.userid || "0");
		const dataMap: Record<string, any> = {
			eventid: params?.eventid,
			userid,
			platid: params?.platid || 2,
			rtype: 1,
			wasm: 1,
			i: "",
			sid: "",
			edt: "",
		};

		return useAxios({
			url: "/verifyservice/v3/get_verify_info",
			encryptType: "android",
			method: "POST",
			data: dataMap,
			cookie: params?.cookie || {},
		});
	},
);
