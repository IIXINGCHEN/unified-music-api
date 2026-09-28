// 检测手机号码是否已注册
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		cellphone: query.phone,
		countrycode: query.countrycode,
	};
	return request(
		`/api/cellphone/existence/check`,
		data,
		createOption(query, "eapi"),
	);
});
