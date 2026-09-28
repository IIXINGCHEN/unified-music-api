// 删除动态
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.evId,
	};
	return request(`/api/event/delete`, data, createOption(query, "weapi"));
});
