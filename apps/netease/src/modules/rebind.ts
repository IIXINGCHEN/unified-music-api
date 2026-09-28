// 更换手机
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		captcha: query.captcha,
		phone: query.phone,
		oldcaptcha: query.oldcaptcha,
		ctcode: query.ctcode || "86",
	};
	return request(
		`/api/user/replaceCellphone`,
		data,
		createOption(query, "weapi"),
	);
});
