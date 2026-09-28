// 相似MV
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		mvid: query.mvid,
	};
	return request(`/api/discovery/simiMV`, data, createOption(query, "weapi"));
});
