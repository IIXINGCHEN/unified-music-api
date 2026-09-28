// 视频链接
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		ids: `["${query.id}"]`,
		resolution: query.res || 1080,
	};
	return request(`/api/cloudvideo/playurl`, data, createOption(query, "weapi"));
});
