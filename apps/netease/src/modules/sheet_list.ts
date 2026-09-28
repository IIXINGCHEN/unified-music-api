// 乐谱列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		abTest: query.ab || "b",
	};
	return request(`/api/music/sheet/list/v1`, data, createOption(query));
});
