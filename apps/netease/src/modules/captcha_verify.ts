// 校验验证码
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		ctcode: query.ctcode || "86",
		cellphone: query.phone,
		captcha: query.captcha,
	};
	return request(`/api/sms/captcha/verify`, data, createOption(query, "weapi"));
});
