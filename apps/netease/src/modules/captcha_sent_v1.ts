// 发送验证码
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		ctcode: query.ctcode || "86",
		secrete: "music_middleuser_pclogin",
		cellphone: query.phone,
		scene: "0",
	};
	return request(
		`/api/middle/captcha/sent/v1`,
		data,
		createOption(query, "eapi"),
	);
});
