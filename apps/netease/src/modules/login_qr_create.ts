import {
	defineModule,
	generateChainId,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule(async (query: NcmQuery, _request: NcmRequestFn) => {
	const platform = query.platform || "pc";
	const cookie = query.cookie || "";

	// 构建基础URL
	let url = `https://music.163.com/login?codekey=${query.key}`;

	// 如果是web平台，则添加chainId参数
	if (platform === "web") {
		const chainId = generateChainId(cookie);
		url += `&chainId=${chainId}`;
	}

	// qrcode 未安装时与原 require 一致：调用即抛错
	const { default: QRCode } = await import("qrcode");

	return {
		code: 200,
		status: 200,
		body: {
			code: 200,
			data: {
				qrurl: url,
				qrimg: query.qrimg ? await QRCode.toDataURL(url) : "",
			},
		},
	};
});
