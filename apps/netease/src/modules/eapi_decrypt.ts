import {
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
import { eapiReqDecrypt, eapiResDecrypt } from "@music-api/ncm-crypto";
export default defineModule(async (query: NcmQuery, _request: NcmRequestFn) => {
	const hexString = query.hexString;
	const isReq = query.isReq !== "false";
	if (!hexString) {
		return {
			status: 400,
			body: {
				code: 400,
				message: "hex string is required",
			},
		};
	}
	// 去除空格
	const pureHexString = hexString.replace(/\s/g, "");
	return {
		status: 200,
		body: {
			code: 200,
			data: isReq
				? eapiReqDecrypt(pureHexString)
				: eapiResDecrypt(pureHexString),
		},
	};
});
