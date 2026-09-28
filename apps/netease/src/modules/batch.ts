// 批量请求接口
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	// biome-ignore lint/suspicious/noExplicitAny: upstream JSON is untyped
	const data: Record<string, any> = {};
	Object.keys(query).forEach((i) => {
		if (/^\/api\//.test(i)) {
			data[i] = query[i];
		}
	});
	return request(`/api/batch`, data, createOption(query));
});
