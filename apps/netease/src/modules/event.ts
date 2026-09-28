// 获取动态列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		pagesize: query.pagesize || 20,
		lasttime: query.lasttime || -1,
	};
	return request(`/api/v1/event/get`, data, createOption(query, "weapi"));
});
