// 发送安全验证码
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		ctcode: query.ctcode || "86",
	};
	return request(
		`/api/sms/captcha/safe/sent`,
		data,
		createOption(query, "eapi"),
	);
});
