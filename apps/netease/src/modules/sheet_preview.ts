// 乐谱预览
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
	};
	return request(`/api/music/sheet/preview/info`, data, createOption(query));
});
