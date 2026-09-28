// mv简要百科信息
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		mvId: query.id,
	};
	return request(`/api/rep/ugc/mv/get`, data, createOption(query));
});
