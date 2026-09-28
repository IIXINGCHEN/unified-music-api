// 粉丝来源
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		startTime: query.startTime || Date.now() - 7 * 24 * 3600 * 1000,
		endTime: query.endTime || Date.now(),
		type: query.type || 0, //新增关注:0 新增取关:1
	};
	return request(`/api/fanscenter/trend/list`, data, createOption(query));
});
