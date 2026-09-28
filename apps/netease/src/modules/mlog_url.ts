// mlog链接
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		resolution: query.res || 1080,
		type: 1,
	};
	return request(`/api/mlog/detail/v1`, data, createOption(query, "weapi"));
});
