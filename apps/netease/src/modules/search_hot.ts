// 热门搜索
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		type: 1111,
	};
	return request(`/api/search/hot`, data, createOption(query));
});
