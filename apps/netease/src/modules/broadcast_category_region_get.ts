// 广播电台 - 分类/地区信息
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(
		`/api/voice/broadcast/category/region/get`,
		data,
		createOption(query),
	);
});
