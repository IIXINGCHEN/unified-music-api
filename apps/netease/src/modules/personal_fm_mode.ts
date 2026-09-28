// 私人FM - 模式选择
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		mode: query.mode,
		subMode: query.submode,
		limit: query.limit || 3,
	};
	return request(`/api/v1/radio/get`, data, createOption(query));
});
