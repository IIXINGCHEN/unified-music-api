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
	};
	return request(`/api/sms/captcha/sent`, data, createOption(query, "weapi"));
});
