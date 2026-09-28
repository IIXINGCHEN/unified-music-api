import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		phone: query.phone,
		captcha: query.captcha,
		oldcaptcha: query.oldcaptcha,
		countrycode: query.countrycode || "86",
	};
	return request(
		`/api/user/replaceCellphone`,
		data,
		createOption(query, "weapi"),
	);
});
