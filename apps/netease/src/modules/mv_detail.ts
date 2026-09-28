// MV详情
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.mvid,
	};
	return request(`/api/v1/mv/detail`, data, createOption(query, "weapi"));
});
