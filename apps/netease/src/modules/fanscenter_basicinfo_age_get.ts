// 粉丝年龄比例
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(
		`/api/fanscenter/basicinfo/age/get`,
		data,
		createOption(query),
	);
});
